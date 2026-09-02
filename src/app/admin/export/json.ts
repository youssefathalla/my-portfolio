/**
 * JSON serializer for submission export (admin-dashboard R10.3, R10.7).
 *
 * A named function so that ExportService and the property test share one code path.
 */
import type { ExportRow } from './export-row';

/** Serialize export rows as pretty-printed JSON (R10.3). */
export function toJson(rows: readonly ExportRow[]): string {
  return JSON.stringify(rows, null, 2);
}
