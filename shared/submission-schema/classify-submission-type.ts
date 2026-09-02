/**
 * Submission_Type classifier — pure, total function deriving the type from
 * the payload's shape (firebase-backend R4.9).
 *
 * This module holds zero Angular imports, zero I/O operations, and zero
 * dependency on the current time, so it is compilable under both the Angular
 * app tsconfig and the Cloud Functions tsconfig (firebase-backend R5.4).
 */

// ---------- Constants ----------

/** Exactly the four keys a contact payload carries (R5.7). */
const CONTACT_KEYS: readonly string[] = ['name', 'email', 'projectType', 'message'];

/** Exactly the six keys an intake-wizard payload carries (R5.8). */
const INTAKE_WIZARD_KEYS: readonly string[] = [
  'goal',
  'timeline',
  'budgetBand',
  'name',
  'email',
  'message',
];

// ---------- Public API ----------

/**
 * Pure, total classifier returning `'contact'` for a payload satisfying R5.7,
 * `'intake-wizard'` for a payload satisfying R5.8, and `null` otherwise.
 *
 * Accepts any value — `null`, `undefined`, primitives, arrays, and non-objects
 * all return `null` with zero thrown errors (firebase-backend R4.9).
 */
export function classifySubmissionType(payload: unknown): 'contact' | 'intake-wizard' | null {
  if (!isNonNullObject(payload)) {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (isContactPayload(record)) return 'contact';
  if (isIntakeWizardPayload(record)) return 'intake-wizard';

  return null;
}

// ---------- Internal helpers ----------

function isNonNullObject(value: unknown): boolean {
  return value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Contact payload: exactly 4 keys matching CONTACT_KEYS, all values strings (R5.7).
 */
function isContactPayload(record: Record<string, unknown>): boolean {
  const keys = Object.keys(record);
  if (keys.length !== CONTACT_KEYS.length) {
    return false;
  }

  for (const key of CONTACT_KEYS) {
    if (!(key in record)) {
      return false;
    }
    if (typeof record[key] !== 'string') {
      return false;
    }
  }

  return true;
}

/**
 * Intake-wizard payload: exactly 6 keys matching INTAKE_WIZARD_KEYS,
 * all values strings (R5.8 — zero Project Type entry).
 */
function isIntakeWizardPayload(record: Record<string, unknown>): boolean {
  const keys = Object.keys(record);
  if (keys.length !== INTAKE_WIZARD_KEYS.length) {
    return false;
  }

  for (const key of INTAKE_WIZARD_KEYS) {
    if (!(key in record)) {
      return false;
    }
    if (typeof record[key] !== 'string') {
      return false;
    }
  }

  return true;
}
