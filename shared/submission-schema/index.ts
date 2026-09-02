/**
 * Submission_Document schema module — shared between the Angular app and Cloud Functions.
 *
 * This module holds the Submission_Document types, validation predicates, and the
 * Submission_Type classifier. It carries zero Angular imports and zero
 * firebase-functions imports, so both tsconfig trees compile it under their own
 * strictness settings from the identical source (firebase-backend R1.5, R5.4).
 */

export {
  type SubmissionType,
  type SubmissionStatus,
  type SubmissionPayload,
  type SubmissionDocument,
  isValidSubmissionDocument,
  isValidPayloadForType,
  toFirestoreWriteRepresentation,
  fromFirestoreReadRepresentation,
  areSubmissionDocumentsEqual,
} from './submission.js';

export { classifySubmissionType } from './classify-submission-type.js';
