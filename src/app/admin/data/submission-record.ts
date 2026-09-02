/**
 * Submission record types and filter state for the admin dashboard (admin-dashboard R7.1, R7.5).
 *
 * Imports the shared Submission_Document schema rather than redeclaring it.
 * `SubmissionRecord` wraps the document with a Firestore identifier and resolved
 * timestamps (the shared schema types `createdAt`/`updatedAt` as `unknown`
 * because they are `Timestamp` on read and a sentinel on write).
 */
import type {
  SubmissionDocument,
  SubmissionStatus,
  SubmissionType,
} from '@submission-schema/submission';

// Re-export for downstream convenience — consumers import from this module
// rather than reaching into the shared schema directly.
export type { SubmissionDocument, SubmissionStatus, SubmissionType };

/** One Submission_Document as the dashboard holds it (R7.1). */
export interface SubmissionRecord {
  readonly id: string;
  readonly document: SubmissionDocument;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
}

export type SortField = 'createdAt' | 'updatedAt' | 'status';
export type SortDirection = 'asc' | 'desc';
export type PageSize = 10 | 25 | 50;

/** The active filter combination and result shaping (R7.4, R7.5, R7.6, R7.7). */
export interface FilterState {
  readonly types: readonly SubmissionType[];
  readonly statuses: readonly SubmissionStatus[];
  readonly tags: readonly string[];
  readonly search: string;
  readonly sortField: SortField;
  readonly sortDirection: SortDirection;
  readonly pageSize: PageSize;
}

/** `createdAt` descending, newest first, nothing filtered (R7.5). */
export const DEFAULT_FILTER_STATE: FilterState = {
  types: [],
  statuses: [],
  tags: [],
  search: '',
  sortField: 'createdAt',
  sortDirection: 'desc',
  pageSize: 25,
} as const;
