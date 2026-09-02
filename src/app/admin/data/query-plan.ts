/**
 * Query planning and pagination utilities for admin submissions.
 * Partitions filters into server Firestore constraints and client predicates.
 */
import type {
  FilterState,
  SortDirection,
  SortField,
  SubmissionRecord,
} from './submission-record';

/** Fields supported in server-side Firestore constraints. */
export type ConstraintField = 'type' | 'status' | 'tags';

/** Operators supported in server-side Firestore constraints. */
export type ConstraintOp = '==' | 'in' | 'array-contains';

/** Server-side Firestore where-clause constraint descriptor. */
export interface ServerConstraint {
  readonly field: ConstraintField;
  readonly op: ConstraintOp;
  readonly value: string | readonly string[];
}

/** Client-side evaluation predicate descriptor. */
export type ClientPredicate =
  | { readonly kind: 'has-tag'; readonly tag: string }
  | { readonly kind: 'search'; readonly term: string };

/** The complete plan for a filter query, split into server and client halves. */
export interface QueryPlan {
  readonly server: readonly ServerConstraint[];
  readonly orderBy: { readonly field: SortField; readonly direction: SortDirection };
  readonly clientPredicates: readonly ClientPredicate[];
}

/** The result of a page extraction from an ordered array. */
export interface PageResult<T> {
  readonly rows: readonly T[];
  readonly nextAfterId: string | null;
  readonly hasNext: boolean;
}

/** A Firestore composite index definition matching the firestore.indexes.json format. */
export interface IndexDefinition {
  readonly collectionGroup: string;
  readonly queryScope: string;
  readonly fields: readonly IndexField[];
}

export interface IndexField {
  readonly fieldPath: string;
  readonly order?: string;
  readonly arrayConfig?: string;
}

/**
 * Splits filter state into server-side Firestore constraints and residual client-side predicates.
 * Restricts server constraints to one array-contains (tags) and delegates search to client.
 */
export function buildQueryPlan(filter: FilterState): QueryPlan {
  const server: ServerConstraint[] = [];
  const clientPredicates: ClientPredicate[] = [];

  // type: one value -> equality; several -> `in`
  if (filter.types.length === 1) {
    server.push({ field: 'type', op: '==', value: filter.types[0] });
  } else if (filter.types.length > 1) {
    server.push({ field: 'type', op: 'in', value: filter.types });
  }

  // status: one value -> equality; several -> `in`
  if (filter.statuses.length === 1) {
    server.push({ field: 'status', op: '==', value: filter.statuses[0] });
  } else if (filter.statuses.length > 1) {
    server.push({ field: 'status', op: 'in', value: filter.statuses });
  }

  // tags: exactly one array-contains is permitted; the rest are residual client predicates.
  if (filter.tags.length > 0) {
    server.push({ field: 'tags', op: 'array-contains', value: filter.tags[0] });
    for (const tag of filter.tags.slice(1)) {
      clientPredicates.push({ kind: 'has-tag', tag });
    }
  }

  // search: always client-side (R7.7). Trim and ignore empty/excessively long terms.
  const term = filter.search.trim();
  if (term.length > 0 && term.length < 100) {
    clientPredicates.push({ kind: 'search', term });
  }

  return {
    server,
    orderBy: { field: filter.sortField, direction: filter.sortDirection },
    clientPredicates,
  };
}

/** Evaluates client-side residual predicates (case-insensitive tag and search term matching). */
export function applyClientPredicates(
  records: readonly SubmissionRecord[],
  predicates: readonly ClientPredicate[],
): readonly SubmissionRecord[] {
  if (predicates.length === 0) return records;
  return records.filter((record) => predicates.every((p) => evaluatePredicate(p, record)));
}

function evaluatePredicate(predicate: ClientPredicate, record: SubmissionRecord): boolean {
  switch (predicate.kind) {
    case 'has-tag':
      return record.document.tags.some(
        (t) => t.toLowerCase() === predicate.tag.toLowerCase(),
      );
    case 'search': {
      const lower = predicate.term.toLowerCase();
      const payload = record.document.payload;
      const name = typeof payload['name'] === 'string' ? payload['name'] : '';
      const email = typeof payload['email'] === 'string' ? payload['email'] : '';
      return name.toLowerCase().includes(lower) || email.toLowerCase().includes(lower);
    }
  }
}

/** Slices a page from an ordered array after a cursor ID, indicating if further pages exist. */
export function takePage<T extends { readonly id: string }>(
  ordered: readonly T[],
  pageSize: number,
  afterId: string | null,
): PageResult<T> {
  const start = afterId === null ? 0 : ordered.findIndex((r) => r.id === afterId) + 1;
  const effectiveStart = afterId !== null && start === 0 ? ordered.length : start;
  const window = ordered.slice(effectiveStart, effectiveStart + pageSize + 1);
  const rows = window.slice(0, pageSize);
  return {
    rows,
    nextAfterId: rows.length > 0 ? rows.at(-1)!.id : null,
    hasNext: window.length > pageSize,
  };
}

/** Sort fields available for admin submissions queries. */
const SORT_FIELDS: readonly SortField[] = ['createdAt', 'updatedAt', 'status'];

/** Filter fields that map to server-side constraints. */
const FILTER_FIELDS: readonly ConstraintField[] = ['type', 'status', 'tags'];

/**
 * Enumerates all composite index definitions required by buildQueryPlan.
 * Excludes degenerate combinations and subsets containing the sort field.
 */
export function enumerateRequiredIndexes(): readonly IndexDefinition[] {
  const indexes: IndexDefinition[] = [];
  const subsets = getNonEmptySubsets(FILTER_FIELDS);

  for (const subset of subsets) {
    for (const sortField of SORT_FIELDS) {
      if (isDegenerate(subset, sortField) || subset.includes(sortField as ConstraintField)) continue;
      indexes.push(buildIndexDefinition(subset, sortField));
    }
  }

  return indexes;
}

/**
 * Returns true when the filter+sort combination is served by a single-field index
 * and does not need a composite index.
 */
function isDegenerate(subset: readonly string[], sortField: SortField): boolean {
  if (subset.length !== 1) return false;
  // tags uses array-contains which always needs a composite index with the orderBy
  if (subset[0] === 'tags') return false;
  // A single equality filter on the same field as the sort is served by the single-field index
  return subset[0] === sortField;
}

/** Builds one Firestore composite index definition from a filter subset and sort field. */
function buildIndexDefinition(
  subset: readonly ConstraintField[],
  sortField: SortField,
): IndexDefinition {
  const fields: IndexField[] = subset.map((filterField) =>
    filterField === 'tags'
      ? { fieldPath: filterField, arrayConfig: 'CONTAINS' }
      : { fieldPath: filterField, order: 'ASCENDING' },
  );

  // Add the orderBy field — DESCENDING covers both directions.
  // Status sort uses ASCENDING (alphabetical ordering).
  fields.push({
    fieldPath: sortField,
    order: sortField === 'status' ? 'ASCENDING' : 'DESCENDING',
  });

  return { collectionGroup: 'submissions', queryScope: 'COLLECTION', fields };
}

// ---------- Internal helpers ----------

/** Returns all non-empty subsets of the given array, preserving order. */
function getNonEmptySubsets<T>(items: readonly T[]): T[][] {
  const result: T[][] = [];
  const n = items.length;
  // Iterate from 1 (skip empty set) to 2^n - 1
  for (let mask = 1; mask < (1 << n); mask++) {
    const subset: T[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        subset.push(items[i]);
      }
    }
    result.push(subset);
  }
  return result;
}
