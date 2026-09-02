/**
 * Submission_Document schema — types and validation predicate.
 *
 * This module is the single source of truth for the eight-field document shape
 * stored in the Submissions_Collection. It holds zero Angular imports, zero I/O
 * operations, and zero dependency on the current time, so it is testable outside
 * any injection context and compilable under both the Angular app tsconfig and
 * the Cloud Functions tsconfig (firebase-backend R5.4).
 */

// ---------- Types ----------

/** The three recognized submission origins (firebase-backend R5.1). */
export type SubmissionType = 'contact' | 'intake-wizard' | 'booking';

/** The four lifecycle states of a submission (firebase-backend R5.1). */
export type SubmissionStatus = 'new' | 'in-progress' | 'archived' | 'spam';

/**
 * A flat map of string, number, and boolean values only — R5.3.
 * Null, arrays, and nested objects are never valid payload values.
 */
export type SubmissionPayload = Readonly<Record<string, string | number | boolean>>;

/**
 * The canonical eight-field Submission_Document shape (firebase-backend R5.1, F3).
 *
 * `createdAt` and `updatedAt` are typed as `unknown` because Firestore represents
 * them as Timestamp objects on read and FieldValue sentinels on write — the
 * validation predicate accepts a caller-supplied `isTimestampLike` check to
 * accommodate both representations.
 */
export interface SubmissionDocument {
  readonly type: SubmissionType;
  readonly status: SubmissionStatus;
  readonly createdAt: unknown;
  readonly updatedAt: unknown;
  readonly read: boolean;
  readonly payload: SubmissionPayload;
  readonly notes: string;
  readonly tags: readonly string[];
}

// ---------- Constants ----------

const SUBMISSION_TYPES: readonly string[] = ['contact', 'intake-wizard', 'booking'];
const SUBMISSION_STATUSES: readonly string[] = ['new', 'in-progress', 'archived', 'spam'];
const EXPECTED_KEY_COUNT = 8;

// ---------- Validation predicate ----------

/**
 * Pure, total validation predicate for Submission_Document (firebase-backend R5.4).
 *
 * Accepts one value of `unknown` type and an `isTimestampLike` function that
 * the caller supplies to handle platform-specific timestamp representations
 * (e.g., Firestore `Timestamp`, `FieldValue.serverTimestamp()`, or plain `Date`).
 *
 * Returns `true` when and only when the value satisfies R5.1, R5.2, and R5.3:
 * - Exactly eight keys (no extra, no missing)
 * - `type` is one of the three SubmissionType values
 * - `status` is one of the four SubmissionStatus values
 * - `createdAt` passes the `isTimestampLike` check
 * - `updatedAt` passes the `isTimestampLike` check
 * - `read` is a boolean
 * - `payload` is a non-null object whose every value is string | number | boolean
 * - `notes` is a string
 * - `tags` is an array of strings
 *
 * Raises zero errors for any input, including null, undefined, or non-object values.
 */
export function isValidSubmissionDocument(
  value: unknown,
  isTimestampLike: (v: unknown) => boolean,
): boolean {
  // Guard: null, undefined, non-object, array
  if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;

  // Exactly eight keys — no extra, no missing (R5.1)
  if (Object.keys(record).length !== EXPECTED_KEY_COUNT) {
    return false;
  }

  // type: one of the three SubmissionType values
  if (!SUBMISSION_TYPES.includes(record['type'] as string)) {
    return false;
  }

  // status: one of the four SubmissionStatus values
  if (!SUBMISSION_STATUSES.includes(record['status'] as string)) {
    return false;
  }

  // createdAt: passes the caller-supplied timestamp check
  if (!isTimestampLike(record['createdAt'])) {
    return false;
  }

  // updatedAt: passes the caller-supplied timestamp check
  if (!isTimestampLike(record['updatedAt'])) {
    return false;
  }

  // read: must be a boolean
  if (typeof record['read'] !== 'boolean') {
    return false;
  }

  // payload: non-null object with every value being string | number | boolean
  if (!isValidPayload(record['payload'])) {
    return false;
  }

  // notes: must be a string
  if (typeof record['notes'] !== 'string') {
    return false;
  }

  // tags: must be an array of strings
  if (!isStringArray(record['tags'])) {
    return false;
  }

  return true;
}

// ---------- Firestore representation round-trip (R5.6) ----------

/**
 * Converts a SubmissionDocument to its Firestore write representation.
 *
 * Returns a plain object with the same eight field names. `createdAt` and
 * `updatedAt` are passed through unchanged — they will be serverTimestamp()
 * sentinels at write time, or Date/Timestamp objects at read time.
 */
export function toFirestoreWriteRepresentation(doc: SubmissionDocument): Record<string, unknown> {
  return {
    type: doc.type,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    read: doc.read,
    payload: { ...doc.payload },
    notes: doc.notes,
    tags: [...doc.tags],
  };
}

/**
 * Converts a Firestore read representation back to a SubmissionDocument.
 *
 * The `resolveTimestamp` parameter lets callers convert platform-specific
 * timestamp objects (Firestore `Timestamp`, `Date`, etc.) to a comparable form
 * that is stored in `createdAt`/`updatedAt`.
 */
export function fromFirestoreReadRepresentation(
  data: Record<string, unknown>,
  resolveTimestamp: (v: unknown) => unknown,
): SubmissionDocument {
  return {
    type: data['type'] as SubmissionType,
    status: data['status'] as SubmissionStatus,
    createdAt: resolveTimestamp(data['createdAt']),
    updatedAt: resolveTimestamp(data['updatedAt']),
    read: data['read'] as boolean,
    payload: data['payload'] as SubmissionPayload,
    notes: data['notes'] as string,
    tags: data['tags'] as readonly string[],
  };
}

/**
 * Compares two SubmissionDocuments for equality.
 *
 * `createdAt`/`updatedAt` are compared by calling the provided `compareTimestamps`
 * function. `payload` is compared by entry set independently of key order — two
 * payloads with the same entries in different insertion order are considered equal.
 */
export function areSubmissionDocumentsEqual(
  a: SubmissionDocument,
  b: SubmissionDocument,
  compareTimestamps: (t1: unknown, t2: unknown) => boolean,
): boolean {
  if (a.type !== b.type) return false;
  if (a.status !== b.status) return false;
  if (!compareTimestamps(a.createdAt, b.createdAt)) return false;
  if (!compareTimestamps(a.updatedAt, b.updatedAt)) return false;
  if (a.read !== b.read) return false;
  if (a.notes !== b.notes) return false;
  if (!arePayloadsEqual(a.payload, b.payload)) return false;
  if (!areStringArraysEqual(a.tags, b.tags)) return false;
  return true;
}

// ---------- Per-type payload predicate (R5.11) ----------

/** Expected entry counts per Submission_Type. */
const PAYLOAD_ENTRY_COUNTS: Readonly<Record<string, number>> = {
  contact: 4,
  'intake-wizard': 6,
  booking: 7,
};

/**
 * Pure, total per-type payload predicate (firebase-backend R5.11).
 *
 * Distinct from `isValidSubmissionDocument`: given a Submission_Type and a payload,
 * returns `true` when and only when the payload satisfies the entry-count and
 * value-bound rules R5.7, R5.8, or R5.9 declares for that type.
 *
 * - `'contact'`: exactly 4 entries, all values string.
 * - `'intake-wizard'`: exactly 6 entries, all values string (zero numeric projectType).
 * - `'booking'`: exactly 7 entries, values may be string | number | boolean.
 *
 * Accepts any value for `payload` — null, undefined, primitives, arrays, and
 * non-objects all return `false` with zero thrown errors.
 */
export function isValidPayloadForType(type: SubmissionType, payload: unknown): boolean {
  // Guard: null, undefined, non-object, array
  if (payload === null || payload === undefined || typeof payload !== 'object' || Array.isArray(payload)) {
    return false;
  }

  const expectedCount = PAYLOAD_ENTRY_COUNTS[type];
  if (expectedCount === undefined) {
    return false;
  }

  const record = payload as Record<string, unknown>;
  const keys = Object.keys(record);

  // Entry count must match exactly
  if (keys.length !== expectedCount) {
    return false;
  }

  // Value-type bounds differ by type
  switch (type) {
    case 'contact':
    case 'intake-wizard':
      // All values must be strings (R5.7, R5.8)
      return keys.every((key) => typeof record[key] === 'string');

    case 'booking':
      // Values may be string | number | boolean (R5.9)
      return keys.every((key) => {
        const v = record[key];
        return typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
      });

    default:
      return false;
  }
}

// ---------- Internal helpers ----------

function isValidPayload(value: unknown): boolean {
  if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const entries = Object.values(value as Record<string, unknown>);
  return entries.every(
    (v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean',
  );
}

function isStringArray(value: unknown): boolean {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every((item) => typeof item === 'string');
}

/**
 * Compares two SubmissionPayload values by entry set, independently of key order.
 * Two payloads are equal when they hold the same set of key-value pairs.
 */
function arePayloadsEqual(a: SubmissionPayload, b: SubmissionPayload): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => key in b && a[key] === b[key]);
}

/**
 * Compares two readonly string arrays for element-wise equality.
 */
function areStringArraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
}
