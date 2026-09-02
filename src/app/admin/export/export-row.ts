/**
 * Export row interface for CSV and JSON serialization (admin-dashboard R10.2, R10.3).
 *
 * One exported row — the eight document fields plus the identifier.
 * Timestamps are pre-converted to ISO 8601 strings upstream (in `toExportRow`),
 * so the serializers (`toCsv`, `toJson`) operate over plain data with no
 * Firestore dependency.
 */
import type { SubmissionStatus, SubmissionType } from '../data/submission-record';

/** One Submission_Document flattened for export (R10.2, R10.3). */
export interface ExportRow {
  readonly id: string;
  readonly type: SubmissionType;
  readonly status: SubmissionStatus;
  readonly createdAt: string; // ISO 8601
  readonly updatedAt: string; // ISO 8601
  readonly read: boolean;
  readonly payload: Readonly<Record<string, string | number | boolean>>;
  readonly notes: string;
  readonly tags: readonly string[];
}
