import { Service, inject } from '@angular/core';
import { Observable, from, of, switchMap, timeout, catchError, map, TimeoutError } from 'rxjs';
import { FirebaseAppService } from '@core/firebase/firebase-app.service';
import { mapFirestoreErrorToOutcome } from '@core/firebase/firestore-outcome-map';
import { classifySubmissionType } from '@submission-schema/classify-submission-type';
import { isValidSubmissionDocument, isValidPayloadForType } from '@submission-schema/submission';
import type { SubmissionPayload, SubmissionType } from '@submission-schema/submission';
import type { Firestore } from 'firebase/firestore';

export type SubmitOutcome =
  | { readonly kind: 'success' }
  | { readonly kind: 'http-error'; readonly status: number }
  | { readonly kind: 'network-error' }
  | { readonly kind: 'timeout' };

/**
 * Service to handle writing contact and enquiry submissions directly to Firestore.
 */
@Service()
export class ContactSubmissionService {
  readonly #firebaseApp = inject(FirebaseAppService);

  submit<TPayload extends object>(payload: TPayload): Observable<SubmitOutcome> {
    return from(this.#firebaseApp.getFirestore()).pipe(
      switchMap((db) =>
        db === null ? of({ kind: 'network-error' } as SubmitOutcome) : this.write(db, payload),
      ),
      timeout({ first: 15_500 }),
      catchError((err) =>
        of(
          err instanceof TimeoutError
            ? ({ kind: 'timeout' } as SubmitOutcome)
            : mapFirestoreErrorToOutcome(err),
        ),
      ),
    );
  }

  private write(db: Firestore, payload: object): Observable<SubmitOutcome> {
    const type = classifySubmissionType(payload);
    if (type === null) {
      return of({ kind: 'http-error', status: 400 } as SubmitOutcome);
    }

    return from(import('firebase/firestore')).pipe(
      switchMap(({ addDoc, collection, serverTimestamp }) => {
        const document = {
          type,
          status: 'new' as const,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          read: false,
          payload,
          notes: '',
          tags: [] as string[],
        };

        if (
          !isValidSubmissionDocument(document, isFirestoreTimestampSentinel) ||
          !isValidPayloadForType(type as SubmissionType, payload as SubmissionPayload)
        ) {
          return of({ kind: 'http-error', status: 400 } as SubmitOutcome);
        }

        return from(addDoc(collection(db, 'submissions'), document)).pipe(
          map(() => ({ kind: 'success' }) as SubmitOutcome),
          catchError((err) => of(mapFirestoreErrorToOutcome(err))),
        );
      }),
      catchError((err) => of(mapFirestoreErrorToOutcome(err))),
    );
  }
}

/**
 * Returns true for Firestore FieldValue sentinel objects (returned by serverTimestamp()).
 */
function isFirestoreTimestampSentinel(value: unknown): boolean {
  if (value === null || value === undefined || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return record['_methodName'] === 'serverTimestamp';
}
