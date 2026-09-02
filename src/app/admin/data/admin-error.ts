/**
 * Admin error codes and user-facing error message mapping.
 */
import type { FirestoreOutcomeCode } from '@core/firebase/firestore-outcome-map';

/** Structured error codes surfaced in the admin dashboard. */
export type AdminErrorCode = FirestoreOutcomeCode;

/** Returns user-facing error message for a given AdminErrorCode. */
export function toAdminErrorMessage(code: AdminErrorCode): string {
  switch (code) {
    case 'permission-denied':
      return 'You do not have permission to perform this action';
    case 'unauthenticated':
      return 'You must be signed in to access this resource';
    case 'unavailable':
      return 'The service is temporarily unavailable — please try again';
    case 'index-missing':
      return 'This filter combination needs a database index — check the console';
    case 'not-found':
      return 'The requested submission was not found';
    case 'rate-limited':
      return 'Too many requests — please wait and try again';
    case 'invalid':
      return 'The request contained invalid data';
    case 'unknown':
      return 'An unexpected error occurred — please try again';
  }
}
