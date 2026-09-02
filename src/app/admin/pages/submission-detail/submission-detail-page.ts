/**
 * SubmissionDetailPage (admin-dashboard R11, R12, R13).
 *
 * Displays one Submission_Document's full content, backed by a single-document
 * `onSnapshot` real-time listener. Provides:
 * - All eight document fields rendered (R11.2)
 * - Automatic read-marking on first open (R11.3)
 * - Status workflow via MatSelect with confirmation dialogs (R12)
 * - Notes editor with dirty tracking and character count (R13.1–R13.3)
 * - Tag manager with optimistic updates and constraint enforcement (R13.4–R13.9)
 * - Back-to-list link preserving filter/page state (R11.8)
 * - Missing-state handling with zero writes (R11.4)
 * - Loading skeleton with 3-second timeout (R11.7)
 */
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { SeoService } from '@core/seo/seo.service';
import { FirebaseAppService } from '@core/firebase/firebase-app.service';
import { isBrowser } from '@core/platform/platform';
import { mapFirestoreErrorToAdminError } from '@core/firebase/firestore-outcome-map';
import { ADMIN_CONTENT } from '../../content/admin.content';
import { SubmissionMutationsService } from '../../data/submission-mutations.service';
import { type AdminErrorCode, toAdminErrorMessage } from '../../data/admin-error';
import type { SubmissionRecord, SubmissionStatus } from '../../data/submission-record';
import { addTag, removeTag, TAG_CONSTRAINTS, type TagRejection } from '../../data/tag-rules';
import { openAdminConfirm } from '../../shared/confirm-dialog';
import { ADMIN_ICON_GLYPH } from '../../shared/admin-icon';
import { SharedIconModule } from '@shared/ui/mat-icon';
import { toHumanLabel } from './humanize-label';

/** The four possible states of the detail page (R11.7, R11.4). */
export type DetailState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly record: SubmissionRecord }
  | { readonly kind: 'missing' }
  | { readonly kind: 'error'; readonly code: AdminErrorCode };

/** All four Submission_Status values for the status selector (R12.1). */
const ALL_STATUSES: readonly SubmissionStatus[] = ['new', 'in-progress', 'archived', 'spam'];

@Component({
  selector: 'app-submission-detail-page',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTooltipModule,
    SharedIconModule,
  ],
  templateUrl: './submission-detail-page.html',
  styleUrl: './submission-detail-page.scss',
})
export class SubmissionDetailPage {
  /** Icon glyph lookup exposed to the template (R11.15). */
  protected readonly ADMIN_ICON_GLYPH = ADMIN_ICON_GLYPH;

  private readonly route = inject(ActivatedRoute);
  private readonly firebase = inject(FirebaseAppService);
  private readonly mutations = inject(SubmissionMutationsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowserContext = isBrowser();

  // ─── State ────────────────────────────────────────────────────────────────────

  /** The current detail page state (R11.7). */
  protected readonly state = signal<DetailState>({ kind: 'loading' });

  /** User-facing error message derived from error state (R11.7). */
  protected readonly errorMessage = computed(() => {
    const s = this.state();
    return s.kind === 'error' ? toAdminErrorMessage(s.code) : null;
  });

  /** The ready-state record, or null (for template binding). */
  protected readonly record = computed(() => {
    const s = this.state();
    return s.kind === 'ready' ? s.record : null;
  });

  /** The Firestore document identifier from the route param. */
  protected readonly id: string;

  // ─── Status Workflow (R12) ────────────────────────────────────────────────────

  /** All available status options for the MatSelect (R12.1). */
  protected readonly allStatuses = ALL_STATUSES;

  /** The pending status shown in the select; drives optimistic UI (R12.3, R12.5). */
  protected readonly pendingStatus = signal<SubmissionStatus>('new');

  /** Whether a status update is in flight (R12.6). */
  protected readonly statusUpdating = signal(false);

  // ─── Notes Editor (R13.1–R13.3) ───────────────────────────────────────────────

  /** The draft notes text (bound to the textarea). */
  protected readonly notesDraft = signal('');

  /** The last-persisted notes value from the server. */
  protected readonly persistedNotes = signal('');

  /** Dirty computed — save button enabled only when draft differs from persisted (R13.3). */
  protected readonly notesDirty = computed(() => this.notesDraft() !== this.persistedNotes());

  /** Whether a notes save is in flight. */
  protected readonly notesSaving = signal(false);

  // ─── Tag Manager (R13.4–R13.9) ────────────────────────────────────────────────

  /** The current tag array (optimistic, reverted on failure). */
  protected readonly tags = signal<readonly string[]>([]);

  /** Tag input separator key codes — Enter and comma (R13.5). */
  protected readonly separatorKeyCodes = [ENTER, COMMA] as const;

  /** Maximum tag constraints exposed to the template. */
  protected readonly tagConstraints = TAG_CONSTRAINTS;

  /** Whether a tag mutation is in flight. */
  protected readonly tagUpdating = signal(false);

  // ─── Internals ────────────────────────────────────────────────────────────────

  /** Latch preventing the read-marking effect from re-firing (R11.3). */
  private readMarked = false;

  /** The onSnapshot unsubscribe function for teardown. */
  private unsubscribe: (() => void) | null = null;

  /** Timeout handle for the 3-second loading ceiling (R11.7). */
  private loadingTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Expose toHumanLabel to the template (R11.5). */
  protected readonly toHumanLabel = toHumanLabel;

  constructor() {
    // R3.6 — SEO exclusion.
    inject(SeoService).initExcludedRoute(ADMIN_CONTENT.submissionDetailTitle, 'noindex, nofollow');

    // Extract the document id from the route param.
    this.id = this.route.snapshot.paramMap.get('id') ?? '';

    // Start the single-document listener.
    if (this.isBrowserContext && this.id) {
      void this.startListener();
    } else if (!this.id) {
      this.state.set({ kind: 'missing' });
    }

    // R11.3 — one-shot read-marking effect guarded by readMarked latch.
    effect(() => {
      const s = this.state();
      if (s.kind === 'ready' && !s.record.document.read && !this.readMarked) {
        this.readMarked = true;
        void this.mutations.patch(this.id, { read: true });
      }
    });

    // R11.7 — 3-second loading timeout.
    if (this.isBrowserContext) {
      this.loadingTimeout = setTimeout(() => {
        if (this.state().kind === 'loading') {
          this.state.set({ kind: 'error', code: 'unavailable' });
        }
      }, 3_000);
    }

    // Teardown on destroy (R7.2 pattern).
    this.destroyRef.onDestroy(() => this.teardown());
  }

  // ─── Template helpers ─────────────────────────────────────────────────────────

  /** Payload entries as [key, stringified value] pairs for the template (R11.5). */
  protected payloadEntries(): readonly [string, string][] {
    const s = this.state();
    if (s.kind !== 'ready') return [];
    const payload = s.record.document.payload;
    return Object.keys(payload).map((key) => [key, String(payload[key])] as [string, string]);
  }

  /** Relative time string for a millisecond epoch (R11.6). */
  protected relativeTime(epochMs: number): string {
    const diff = Date.now() - epochMs;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  /** Full ISO date string for tooltip (R11.6). */
  protected fullDate(epochMs: number): string {
    return new Date(epochMs).toISOString();
  }

  // ─── Status Workflow Actions (R12) ────────────────────────────────────────────

  /** Status change handler (R12.2, R12.3, R12.4, R12.5, R12.6). */
  protected async onStatusChange(next: SubmissionStatus): Promise<void> {
    const s = this.state();
    if (s.kind !== 'ready') return;
    const previous = s.record.document.status;

    // R12.3 — confirmation for spam/archived.
    if (next === 'spam' || next === 'archived') {
      const message = ADMIN_CONTENT.statusConfirm[next];
      const confirmed = await this.confirm(message);
      if (!confirmed) {
        this.pendingStatus.set(previous);
        return;
      }
    }

    this.statusUpdating.set(true);
    try {
      await this.mutations.patch(this.id, { status: next });
      this.snackBar.open(`Status updated to ${next}`, '', { duration: 3000 }); // R12.4
    } catch (err) {
      this.pendingStatus.set(previous); // R12.5
      console.error('[admin-dashboard R12.5] status update failed', err);
      this.snackBar.open('Failed to update status', '', { duration: 3000 });
    } finally {
      this.statusUpdating.set(false); // R12.6
    }
  }

  // ─── Notes Editor Actions (R13.1–R13.3) ───────────────────────────────────────

  /** Save notes handler (R13.2). */
  protected async saveNotes(): Promise<void> {
    if (!this.notesDirty()) return;

    this.notesSaving.set(true);
    try {
      await this.mutations.patch(this.id, { notes: this.notesDraft() });
      this.snackBar.open('Notes saved', '', { duration: 3000 }); // R13.2
    } catch {
      this.snackBar.open('Failed to save notes', '', { duration: 3000 });
    } finally {
      this.notesSaving.set(false);
    }
  }

  /** Notes draft change handler (bound via ngModel). */
  protected onNotesDraftChange(value: string): void {
    this.notesDraft.set(value);
  }

  // ─── Tag Manager Actions (R13.4–R13.9) ────────────────────────────────────────

  /** Add tag handler (R13.5, R13.7, R13.9). */
  protected async onAddTag(event: MatChipInputEvent): Promise<void> {
    const candidate = event.value;
    event.chipInput.clear();

    const result = addTag(this.tags(), candidate);
    if (!result.ok) {
      this.announceTagRejection(result.reason, candidate.trim());
      return;
    }

    // Optimistic update.
    const previousTags = this.tags();
    this.tags.set(result.tags);
    void this.announcer.announce(`Tag ${candidate.trim()} added`); // R13.9

    this.tagUpdating.set(true);
    try {
      await this.mutations.patch(this.id, { tags: [...result.tags] });
    } catch {
      this.tags.set(previousTags); // Revert on failure (R13.8).
      this.snackBar.open('Failed to update tags', '', { duration: 3000 });
    } finally {
      this.tagUpdating.set(false);
    }
  }

  /** Remove tag handler (R13.6, R13.9). */
  protected async onRemoveTag(tag: string): Promise<void> {
    const previousTags = this.tags();
    const newTags = removeTag(previousTags, tag);

    // Optimistic update.
    this.tags.set(newTags);
    void this.announcer.announce(`Tag ${tag} removed`); // R13.9

    this.tagUpdating.set(true);
    try {
      await this.mutations.patch(this.id, { tags: [...newTags] });
    } catch {
      this.tags.set(previousTags); // Revert on failure (R13.8).
      this.snackBar.open('Failed to update tags', '', { duration: 3000 });
    } finally {
      this.tagUpdating.set(false);
    }
  }

  // ─── Retry (R11.7) ───────────────────────────────────────────────────────────

  /** Retry fetching the document after an error state. */
  protected retry(): void {
    this.state.set({ kind: 'loading' });
    this.teardown();
    void this.startListener();
    this.loadingTimeout = setTimeout(() => {
      if (this.state().kind === 'loading') {
        this.state.set({ kind: 'error', code: 'unavailable' });
      }
    }, 3_000);
  }

  // ─── Private ──────────────────────────────────────────────────────────────────

  /** Opens the shared confirm dialog and returns its resolved value (R12.3). */
  private confirm(message: string): Promise<boolean> {
    return openAdminConfirm(this.dialog, message);
  }

  /** Starts the single-document onSnapshot listener. */
  private async startListener(): Promise<void> {
    const db = await this.firebase.getFirestore();
    if (db === null) {
      this.state.set({ kind: 'error', code: 'unavailable' });
      return;
    }

    try {
      const { doc, onSnapshot } = await import('firebase/firestore');
      const ref = doc(db, 'submissions', this.id);

      this.unsubscribe = onSnapshot(
        ref,
        (snapshot) => {
          this.clearLoadingTimeout();

          if (!snapshot.exists()) {
            this.state.set({ kind: 'missing' }); // R11.4
            return;
          }

          const data = snapshot.data();
          const createdAt = data['createdAt'];
          const updatedAt = data['updatedAt'];

          const record: SubmissionRecord = {
            id: snapshot.id,
            document: {
              type: data['type'],
              status: data['status'],
              createdAt,
              updatedAt,
              read: data['read'] ?? false,
              payload: data['payload'] ?? {},
              notes: data['notes'] ?? '',
              tags: data['tags'] ?? [],
            },
            createdAtMs: createdAt?.toMillis?.() ?? 0,
            updatedAtMs: updatedAt?.toMillis?.() ?? 0,
          };

          this.state.set({ kind: 'ready', record });

          // Sync local state with server state (reconcile optimistic).
          this.pendingStatus.set(record.document.status);
          this.persistedNotes.set(record.document.notes);
          this.tags.set(record.document.tags);

          // Only overwrite draft if user hasn't started editing (no dirty state).
          if (!this.notesDirty()) {
            this.notesDraft.set(record.document.notes);
          }
        },
        (err) => {
          this.clearLoadingTimeout();
          this.state.set({ kind: 'error', code: mapFirestoreErrorToAdminError(err) }); // R7.8
          this.unsubscribe?.();
          this.unsubscribe = null;
        },
      );
    } catch (err) {
      this.clearLoadingTimeout();
      this.state.set({ kind: 'error', code: mapFirestoreErrorToAdminError(err) });
    }
  }

  /** Announce tag rejection reason (R13.9). */
  private announceTagRejection(reason: TagRejection, candidate: string): void {
    const messages: Record<TagRejection, string> = {
      empty: 'Tag cannot be empty',
      'too-long': `Tag "${candidate}" exceeds ${TAG_CONSTRAINTS.maxLength} characters`,
      duplicate: `Tag "${candidate}" already exists`,
      'limit-reached': `Maximum of ${TAG_CONSTRAINTS.maxTags} tags reached`,
    };
    void this.announcer.announce(messages[reason]);
  }

  /** Clears the loading timeout if still pending. */
  private clearLoadingTimeout(): void {
    if (this.loadingTimeout !== null) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
  }

  /** Tears down the listener and timeout. */
  private teardown(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.clearLoadingTimeout();
  }
}
