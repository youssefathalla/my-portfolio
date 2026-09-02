/**
 * Manages Firestore submissions collection queries, providing real-time
 * signal-based state, cursor pagination, and client-side predicate filtering.
 */
import { DestroyRef, effect, inject, Service, signal } from '@angular/core';
import type {
  CollectionReference,
  QueryConstraint,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { FirebaseAppService } from '@core/firebase/firebase-app.service';
import { mapFirestoreErrorToAdminError } from '@core/firebase/firestore-outcome-map';
import { isBrowser } from '@core/platform/platform';
import type { SubmissionPayload } from '@submission-schema/submission';
import type { AdminErrorCode } from './admin-error';
import { buildQueryPlan, applyClientPredicates, type QueryPlan } from './query-plan';
import {
  DEFAULT_FILTER_STATE,
  type FilterState,
  type SubmissionRecord,
  type SubmissionDocument,
  type SubmissionStatus,
  type SubmissionType,
} from './submission-record';

/** Structured query error state. */
export type QueryError = { readonly code: AdminErrorCode } | null;

/** Type-level alias for dynamically imported Firestore module. */
type FirestoreModule = typeof import('firebase/firestore');
type WhereFn = FirestoreModule['where'];
type OrderByFn = FirestoreModule['orderBy'];
type QueryFn = FirestoreModule['query'];
type GetCountFromServerFn = FirestoreModule['getCountFromServer'];

/** Timestamp-like object supporting optional epoch conversion. */
interface TimestampLike {
  readonly toMillis?: () => number;
}

/** Raw Firestore submission document data before validation and defaults. */
interface RawSubmissionData {
  readonly type: SubmissionType;
  readonly status: SubmissionStatus;
  readonly createdAt?: TimestampLike;
  readonly updatedAt?: TimestampLike;
  readonly read?: boolean;
  readonly payload?: SubmissionPayload;
  readonly notes?: string;
  readonly tags?: readonly string[];
}

@Service()
export class SubmissionsQueryService {
  private readonly firebase = inject(FirebaseAppService);
  private readonly isBrowserContext = isBrowser();
  private readonly destroyRef = inject(DestroyRef);

  /** Active filter state that drives the query effect. */
  readonly filterState = signal<FilterState>(DEFAULT_FILTER_STATE);

  /** Document ID cursor for pagination (null = first page). */
  readonly afterId = signal<string | null>(null);

  /** Filtered records for the current page. */
  readonly visibleRecords = signal<readonly SubmissionRecord[]>([]);

  /** Loading state indicator. */
  readonly loading = signal<boolean>(false);

  /** True when serving cached data due to network disconnection. */
  readonly disconnected = signal<boolean>(false);

  /** Active query error, if any. */
  readonly error = signal<QueryError>(null);

  /** Server-side total count matching the current filters. */
  readonly totalCount = signal<number>(0);

  /** True if client predicates mean totalCount is an upper bound. */
  readonly totalCountIsUpperBound = signal<boolean>(false);

  /** Whether additional records exist beyond the current page. */
  readonly hasNext = signal<boolean>(false);

  /** Whether a previous page exists in cursor history. */
  readonly hasPrevious = signal<boolean>(false);

  /** Recently added document IDs for row highlight animations. */
  readonly recentlyAddedIds = signal<readonly string[]>([]);

  private listenerUnsub: (() => void) | null = null;
  private firstSnapshotReceived = false;
  private recentlyAddedTimeout: ReturnType<typeof setTimeout> | null = null;
  private cursorHistory: string[] = [];

  constructor() {
    if (!this.isBrowserContext) {
      return;
    }

    this.destroyRef.onDestroy(() => this.teardown());

    effect(() => {
      const filter = this.filterState();
      const afterId = this.afterId();

      this.teardownListener();
      this.error.set(null);
      this.loading.set(true);
      this.firstSnapshotReceived = false;

      void this.subscribe(filter, afterId);
    });
  }

  // ----- Public methods for pagination -----

  /** Navigate to the next page using the last visible record's ID as cursor. */
  nextPage(): void {
    const records = this.visibleRecords();
    if (records.length === 0 || !this.hasNext()) return;
    const lastId = records.at(-1)!.id;
    const currentAfter = this.afterId();
    if (currentAfter !== null) {
      this.cursorHistory.push(currentAfter);
    } else {
      // Mark the start: first page has null cursor, so push a sentinel.
      this.cursorHistory.push('');
    }
    this.afterId.set(lastId);
  }

  /** Navigate to the previous page. */
  previousPage(): void {
    if (this.cursorHistory.length === 0) return;
    const previous = this.cursorHistory.pop()!;
    this.afterId.set(previous === '' ? null : previous);
  }

  /** Update the page size, resetting to the first page. */
  setPageSize(size: 10 | 25 | 50): void {
    const current = this.filterState();
    if (current.pageSize === size) return;
    this.cursorHistory = [];
    this.afterId.set(null);
    this.filterState.set({ ...current, pageSize: size });
  }

  /** Update the filter state, resetting cursor and pagination history. */
  setFilter(filter: FilterState): void {
    this.cursorHistory = [];
    this.afterId.set(null);
    this.filterState.set(filter);
  }

  // ----- Private: subscription management -----

  /**
   * Builds the Firestore query from the current filter state, subscribes
   * with `onSnapshot`, and issues a separate `getCountFromServer` call.
   */
  private async subscribe(filter: FilterState, afterId: string | null): Promise<void> {
    try {
      const db = await this.firebase.getFirestore();
      if (db === null) {
        this.loading.set(false);
        this.error.set({ code: 'unavailable' });
        return;
      }

      const {
        collection,
        query,
        where,
        orderBy,
        limit,
        startAfter,
        onSnapshot,
        getCountFromServer,
        doc,
        getDoc,
      } = await import('firebase/firestore');

      const plan = buildQueryPlan(filter);

      // Build the Firestore query from server constraints + orderBy.
      const col = collection(db, 'submissions');
      const constraints = this.buildFirestoreConstraints(plan, where, orderBy);

      // Add pagination: fetch pageSize + 1 for hasNext detection.
      const fetchSize = filter.pageSize + 1;
      constraints.push(limit(fetchSize));

      // Cursor support: startAfter the document with afterId.
      if (afterId !== null) {
        const cursorDoc = doc(db, 'submissions', afterId);
        const cursorSnap = await getDoc(cursorDoc);
        if (cursorSnap.exists()) {
          constraints.push(startAfter(cursorSnap));
        }
      }

      const q = query(col, ...constraints);

      // Update totalCountIsUpperBound based on whether client predicates exist.
      this.totalCountIsUpperBound.set(plan.clientPredicates.length > 0);

      // Update hasPrevious based on cursor history.
      this.hasPrevious.set(afterId !== null);

      // Issue a separate getCountFromServer for totalCount (R7.6).
      void this.fetchTotalCount(plan, col, where, orderBy, query, getCountFromServer);

      // Subscribe with onSnapshot (R7.2, R7.9).
      this.listenerUnsub = onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snapshot) => {
          // Convert docs to SubmissionRecord[], applying client predicates.
          const allRecords = snapshot.docs.map((d) => this.toSubmissionRecord(d));

          // The extra document is for hasNext detection — slice to pageSize.
          const pageRecords = allRecords.slice(0, filter.pageSize);
          this.hasNext.set(allRecords.length > filter.pageSize);

          // Apply client-side predicates
          const filtered = applyClientPredicates(pageRecords, plan.clientPredicates);
          this.visibleRecords.set(filtered);

          // Update disconnected state from metadata
          this.disconnected.set(snapshot.metadata.fromCache);

          // Detect newly added documents for highlight animation
          if (this.firstSnapshotReceived) {
            const addedIds = snapshot
              .docChanges()
              .filter((change) => change.type === 'added')
              .map((change) => change.doc.id);

            if (addedIds.length > 0) {
              this.recentlyAddedIds.set(addedIds);
              this.clearRecentlyAddedAfterDelay();
            }
          } else {
            this.firstSnapshotReceived = true;
          }

          this.loading.set(false);
        },
        (err) => {
          this.error.set({ code: mapFirestoreErrorToAdminError(err) });
          this.loading.set(false);
          this.teardownListener();
        },
      );
    } catch (err) {
      this.error.set({ code: mapFirestoreErrorToAdminError(err) });
      this.loading.set(false);
    }
  }

  /** Issues getCountFromServer for current server constraints to populate totalCount. */
  private async fetchTotalCount(
    plan: QueryPlan,
    col: CollectionReference,
    whereFn: WhereFn,
    orderByFn: OrderByFn,
    queryFn: QueryFn,
    getCountFromServerFn: GetCountFromServerFn,
  ): Promise<void> {
    try {
      const countConstraints = this.buildFirestoreConstraints(plan, whereFn, orderByFn);
      const countQuery = queryFn(col, ...countConstraints);
      const countSnap = await getCountFromServerFn(countQuery);
      this.totalCount.set(countSnap.data().count);
    } catch {
      // Non-fatal; retains current count
    }
  }

  /** Builds Firestore where() and orderBy() constraints from the query plan. */
  private buildFirestoreConstraints(
    plan: QueryPlan,
    whereFn: WhereFn,
    orderByFn: OrderByFn,
  ): QueryConstraint[] {
    const constraints: QueryConstraint[] = [];

    for (const sc of plan.server) {
      constraints.push(whereFn(sc.field, sc.op, sc.value));
    }

    constraints.push(orderByFn(plan.orderBy.field, plan.orderBy.direction));

    return constraints;
  }

  /** Converts a Firestore QueryDocumentSnapshot to a SubmissionRecord. */
  private toSubmissionRecord(docSnap: QueryDocumentSnapshot): SubmissionRecord {
    const data = docSnap.data() as RawSubmissionData;
    const createdAtMs = data.createdAt?.toMillis?.() ?? 0;
    const updatedAtMs = data.updatedAt?.toMillis?.() ?? 0;

    const document: SubmissionDocument = {
      type: data.type,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      read: data.read ?? false,
      payload: data.payload ?? {},
      notes: data.notes ?? '',
      tags: data.tags ?? [],
    };

    return {
      id: docSnap.id,
      document,
      createdAtMs,
      updatedAtMs,
    };
  }

  // ----- Private: utilities -----

  /** Clears `recentlyAddedIds` after a 2-second delay. */
  private clearRecentlyAddedAfterDelay(): void {
    if (this.recentlyAddedTimeout !== null) {
      clearTimeout(this.recentlyAddedTimeout);
    }
    this.recentlyAddedTimeout = setTimeout(() => {
      this.recentlyAddedIds.set([]);
      this.recentlyAddedTimeout = null;
    }, 2_000);
  }

  /** Tears down the current listener only (not the full service). */
  private teardownListener(): void {
    if (this.listenerUnsub) {
      this.listenerUnsub();
      this.listenerUnsub = null;
    }
  }

  /** Full teardown: listener + timeouts (called on destroy). */
  private teardown(): void {
    this.teardownListener();
    if (this.recentlyAddedTimeout !== null) {
      clearTimeout(this.recentlyAddedTimeout);
      this.recentlyAddedTimeout = null;
    }
  }
}
