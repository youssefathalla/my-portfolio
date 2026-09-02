/**
 * Firestore composite index drift guard.
 * Verifies that firestore.indexes.json includes all required composite indexes
 * needed by query plans, reporting missing indexes as build errors and extras as info.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  enumerateRequiredIndexes,
  type IndexDefinition,
  type IndexField,
} from '../../src/app/admin/data/query-plan';

/** The result of the index drift check. */
export interface FirestoreIndexCheckResult {
  /** Missing indexes — these cause a build failure. */
  readonly failures: readonly string[];
  /** Extra indexes in the file not covered by the enumeration — informational only. */
  readonly info: readonly string[];
}

/**
 * Compares required indexes from enumerateRequiredIndexes against firestore.indexes.json.
 *
 * @param workspaceRoot - Absolute path to workspace root.
 */
export function checkFirestoreIndexes(workspaceRoot: string): FirestoreIndexCheckResult {
  const failures: string[] = [];
  const info: string[] = [];

  const indexFilePath = resolve(workspaceRoot, 'firestore.indexes.json');

  if (!existsSync(indexFilePath)) {
    failures.push(`firestore.indexes.json not found at "${indexFilePath}"`);
    return { failures, info };
  }

  let fileIndexes: IndexDefinition[];
  try {
    const raw = readFileSync(indexFilePath, 'utf-8');
    const parsed = JSON.parse(raw) as { indexes?: IndexDefinition[] };
    fileIndexes = parsed.indexes ?? [];
  } catch (err) {
    failures.push(`firestore.indexes.json could not be parsed: ${(err as Error).message}`);
    return { failures, info };
  }

  const requiredIndexes = enumerateRequiredIndexes();

  // Check every required index exists in the file.
  for (const required of requiredIndexes) {
    if (!fileIndexes.some((existing) => indexesMatch(required, existing))) {
      failures.push(
        `missing composite index: ${JSON.stringify(required, null, 2)}`,
      );
    }
  }

  // Report extra indexes (present in file but not required) as informational.
  for (const existing of fileIndexes) {
    if (!requiredIndexes.some((required) => indexesMatch(required, existing))) {
      const label = existing.fields.map((f) => f.fieldPath).join(', ');
      info.push(
        `extra index in firestore.indexes.json not covered by enumerateRequiredIndexes(): ` +
        `collectionGroup="${existing.collectionGroup}", fields=[${label}]`,
      );
    }
  }

  return { failures, info };
}

/**
 * Compares two index definitions for logical equivalence:
 * same collectionGroup, same queryScope, same fields (order-sensitive).
 */
function indexesMatch(a: IndexDefinition, b: IndexDefinition): boolean {
  if (a.collectionGroup !== b.collectionGroup) return false;
  if (a.queryScope !== b.queryScope) return false;
  if (a.fields.length !== b.fields.length) return false;
  return a.fields.every((af, i) => fieldsMatch(af, b.fields[i]));
}

/** Compares two index field definitions for equivalence. */
function fieldsMatch(a: IndexField, b: IndexField): boolean {
  if (a.fieldPath !== b.fieldPath) return false;
  // Both have order, or both have arrayConfig, or both are unset in the same way.
  if (a.order && b.order) return a.order === b.order;
  if (a.arrayConfig && b.arrayConfig) return a.arrayConfig === b.arrayConfig;
  // One has order and the other has arrayConfig — not a match.
  if (a.order !== b.order) return false;
  if (a.arrayConfig !== b.arrayConfig) return false;
  return true;
}
