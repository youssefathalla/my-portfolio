import { DestroyRef, inject, Service, signal } from '@angular/core';
import { FirebaseAppService } from '@core/firebase/firebase-app.service';
import { mapFirestoreErrorToAdminError } from '@core/firebase/firestore-outcome-map';
import { isBrowser } from '@core/platform/platform';
import type { AdminErrorCode } from './admin-error';
import { startOfIsoWeek } from './iso-week';

/** Count state variants for dashboard metric cards. */
export type CountState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly value: number }
  | { readonly kind: 'error'; readonly code: AdminErrorCode };

/** Dashboard count metric keys. */
export type CountKey = 'total' | 'unread' | 'inProgress' | 'thisWeek';

/**
 * Loads dashboard submission count metrics and refreshes on updates.
 * Exposes each metric as an independent signal to isolate failures.
 */
@Service()
export class OverviewCountsService {
  private readonly firebase = inject(FirebaseAppService);
  private readonly isBrowserContext = isBrowser();
  private readonly destroyRef = inject(DestroyRef);

  /** Independent count state signals. */
  readonly total = signal<CountState>({ kind: 'loading' });
  readonly unread = signal<CountState>({ kind: 'loading' });
  readonly inProgress = signal<CountState>({ kind: 'loading' });
  readonly thisWeek = signal<CountState>({ kind: 'loading' });

  private readonly timeouts = new Map<CountKey, ReturnType<typeof setTimeout>>();
  private beaconUnsub: (() => void) | null = null;
  private initialized = false;
  private isDestroyed = false;

  constructor() {
    if (!this.isBrowserContext) {
      // Non-browser: hold all at error immediately (R1.7 pattern).
      this.total.set({ kind: 'error', code: 'unavailable' });
      this.unread.set({ kind: 'error', code: 'unavailable' });
      this.inProgress.set({ kind: 'error', code: 'unavailable' });
      this.thisWeek.set({ kind: 'error', code: 'unavailable' });
      return;
    }

    this.destroyRef.onDestroy(() => this.teardown());
  }

  /**
   * Initializes counts and starts the real-time beacon listener.
   * Safe to call multiple times (idempotent).
   */
  async init(): Promise<void> {
    if (!this.isBrowserContext || this.initialized || this.isDestroyed) return;
    this.initialized = true;
    await this.fetchAllCounts();
    if (this.isDestroyed) return;
    await this.startBeacon();
  }

  /**
   * Retry a specific card or all four if omitted (R6.5).
   */
  refresh(which?: CountKey): void {
    if (!this.isBrowserContext || this.isDestroyed) return;
    if (which) {
      this.getSignal(which).set({ kind: 'loading' });
      this.armTimeout(which);
      void this.fetchCount(which);
    } else {
      void this.fetchAllCounts();
    }
  }

  /**
   * Fetches all four counts, setting each to loading and arming timeouts.
   */
  private async fetchAllCounts(): Promise<void> {
    const keys: CountKey[] = ['total', 'unread', 'inProgress', 'thisWeek'];
    for (const key of keys) {
      this.getSignal(key).set({ kind: 'loading' });
      this.armTimeout(key);
    }
    await Promise.all(keys.map((key) => this.fetchCount(key)));
  }

  /**
   * Fetches one count via `getCountFromServer` and updates the signal.
   */
  private async fetchCount(key: CountKey): Promise<void> {
    try {
      const db = await this.firebase.getFirestore();
      if (db === null) {
        this.clearTimeout(key);
        this.getSignal(key).set({ kind: 'error', code: 'unavailable' });
        return;
      }

      const { collection, query, where, getCountFromServer, Timestamp } =
        await import('firebase/firestore');

      const col = collection(db, 'submissions');
      let q;

      switch (key) {
        case 'total':
          q = query(col);
          break;
        case 'unread':
          q = query(col, where('read', '==', false));
          break;
        case 'inProgress':
          q = query(col, where('status', '==', 'in-progress'));
          break;
        case 'thisWeek':
          q = query(col, where('createdAt', '>=', Timestamp.fromMillis(startOfIsoWeek(Date.now()))));
          break;
      }

      const snapshot = await getCountFromServer(q);
      this.clearTimeout(key);
      this.getSignal(key).set({ kind: 'ready', value: snapshot.data().count });
    } catch (err) {
      this.clearTimeout(key);
      this.getSignal(key).set({ kind: 'error', code: mapFirestoreErrorToAdminError(err) });
    }
  }

  /**
   * Starts the Count_Beacon — one `onSnapshot` over
   * `query(collection(db,'submissions'), orderBy('updatedAt','desc'), limit(1))`
   * that re-issues all four aggregates on every fire (R6.3).
   */
  private async startBeacon(): Promise<void> {
    try {
      const db = await this.firebase.getFirestore();
      if (db === null) return;

      const { collection, query, orderBy, limit, onSnapshot } =
        await import('firebase/firestore');

      const beaconQuery = query(
        collection(db, 'submissions'),
        orderBy('updatedAt', 'desc'),
        limit(1),
      );

      // Skip the first snapshot since we already fetched counts during initialize.
      let firstFire = true;
      this.beaconUnsub = onSnapshot(beaconQuery, () => {
        if (firstFire) {
          firstFire = false;
          return;
        }
        // Re-issue all four aggregates on every subsequent beacon fire (R6.3).
        void this.fetchAllCounts();
      });
    } catch {
      // Beacon setup failure is non-fatal — counts still work via manual refresh.
    }
  }

  /**
   * Arms a 5-second timeout for a specific card. If the card is still `loading`
   * when the timeout fires, it flips to `error` (R6.4).
   */
  private armTimeout(key: CountKey): void {
    this.clearTimeout(key);
    const handle = setTimeout(() => {
      const sig = this.getSignal(key);
      if (sig().kind === 'loading') {
        sig.set({ kind: 'error', code: 'unavailable' });
      }
    }, 5_000);
    this.timeouts.set(key, handle);
  }

  /** Clears an armed timeout for a card. */
  private clearTimeout(key: CountKey): void {
    const handle = this.timeouts.get(key);
    if (handle !== undefined) {
      clearTimeout(handle);
      this.timeouts.delete(key);
    }
  }

  /** Returns the writable signal for a given key. */
  private getSignal(key: CountKey) {
    switch (key) {
      case 'total': return this.total;
      case 'unread': return this.unread;
      case 'inProgress': return this.inProgress;
      case 'thisWeek': return this.thisWeek;
    }
  }

  /** Tears down the beacon listener and clears all timeouts. */
  private teardown(): void {
    this.isDestroyed = true;
    if (this.beaconUnsub) {
      this.beaconUnsub();
      this.beaconUnsub = null;
    }
    for (const [key] of this.timeouts) {
      this.clearTimeout(key);
    }
  }
}
