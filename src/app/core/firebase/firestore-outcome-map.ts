import type { SubmitOutcome } from '@core/services/contact/contact-submission.service';

/** Firestore error outcome codes shared across core and admin modules. */
export type FirestoreOutcomeCode =
  | 'permission-denied' | 'unauthenticated' | 'unavailable' | 'index-missing'
  | 'not-found'         | 'rate-limited'    | 'invalid'     | 'unknown';

/** Maps Firestore error codes to representative HTTP status codes. */
const CODE_TO_STATUS: Readonly<Record<string, number>> = {
  'permission-denied': 403,
  'resource-exhausted': 429,
  unauthenticated: 401,
  'invalid-argument': 400,
};

/** Maps Firestore error codes to normalized admin error codes. */
const CODE_TO_ADMIN_ERROR: Readonly<Record<string, FirestoreOutcomeCode>> = {
  'permission-denied': 'permission-denied',
  unauthenticated: 'unauthenticated',
  unavailable: 'unavailable',
  'failed-precondition': 'index-missing',
  'not-found': 'not-found',
  'resource-exhausted': 'rate-limited',
  'invalid-argument': 'invalid',
};

/** Extracts and normalizes Firestore error code (strips optional 'firestore/' prefix). */
export function extractFirestoreErrorCode(err: unknown): string | null {
  if (err == null || typeof err !== 'object') {
    return null;
  }
  const code = (err as Record<string, unknown>)['code'];
  if (typeof code !== 'string' || code.length === 0) {
    return null;
  }
  const prefix = 'firestore/';
  return code.startsWith(prefix) ? code.slice(prefix.length) : code;
}

/** Maps a Firestore error to a SubmitOutcome (HTTP error status or network error). */
export function mapFirestoreErrorToOutcome(err: unknown): SubmitOutcome {
  const code = extractFirestoreErrorCode(err);

  if (code === null) {
    return { kind: 'http-error', status: 500 };
  }

  if (code === 'unavailable') {
    return { kind: 'network-error' };
  }

  const status = CODE_TO_STATUS[code];
  return { kind: 'http-error', status: status ?? 500 };
}

/** Maps a Firestore error to a FirestoreOutcomeCode for admin error handling. */
export function mapFirestoreErrorToAdminError(err: unknown): FirestoreOutcomeCode {
  const code = extractFirestoreErrorCode(err);
  return code === null ? 'unknown' : (CODE_TO_ADMIN_ERROR[code] ?? 'unknown');
}
