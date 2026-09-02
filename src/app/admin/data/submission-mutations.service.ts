/**
 * Service for updating submission documents in Firestore.
 * Restricts updates to permitted mutable fields and sets updatedAt server timestamp.
 */
import { inject, Service } from '@angular/core';
import { FirebaseAppService } from '@core/firebase/firebase-app.service';
import { isBrowser } from '@core/platform/platform';
import { mapFirestoreErrorToAdminError } from '@core/firebase/firestore-outcome-map';
import type { AdminErrorCode } from './admin-error';
import type { SubmissionDocument } from './submission-record';
import { reconcileBulkResult, type BulkOutcome } from './bulk-result';

/** Mutable submission fields permitted by security rules. */
export type PatchFields = Partial<Pick<SubmissionDocument, 'status' | 'read' | 'notes' | 'tags'>>;

/** Error thrown when a Firestore mutation fails, carrying an AdminErrorCode. */
export class MutationError extends Error {
  constructor(readonly code: AdminErrorCode) {
    super(code);
  }
}

@Service()
export class SubmissionMutationsService {
  private readonly firebase = inject(FirebaseAppService);
  private readonly isBrowserContext = isBrowser();

  /** Updates a single submission document, appending the server timestamp. */
  async patch(id: string, fields: PatchFields): Promise<void> {
    if (!this.isBrowserContext) {
      throw new MutationError('unavailable');
    }

    const db = await this.firebase.getFirestore();
    if (db === null) {
      throw new MutationError('unavailable');
    }

    try {
      const { updateDoc, doc, serverTimestamp } = await import('firebase/firestore');
      const ref = doc(db, 'submissions', id);
      await updateDoc(ref, { ...fields, updatedAt: serverTimestamp() });
    } catch (err: unknown) {
      throw new MutationError(mapFirestoreErrorToAdminError(err));
    }
  }

  /** Concurrently patches multiple submissions, reconciling partial successes. */
  async applyBulk(ids: readonly string[], patch: PatchFields): Promise<BulkOutcome> {
    const results = await Promise.allSettled(
      ids.map((id) => this.patch(id, patch)),
    );
    return reconcileBulkResult(ids, results);
  }
}
