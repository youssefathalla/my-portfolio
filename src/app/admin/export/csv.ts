/**
 * CSV serializer for admin submission exports (admin-dashboard R10.2, R10.6).
 *
 * Implements RFC 4180: comma-separated fields, CRLF-terminated records,
 * fields quoted only when they contain a comma, double quote, CR, or LF,
 * with embedded double quotes doubled.
 *
 * `payload` and `tags` columns are JSON-encoded before escaping, so
 * heterogeneous payload shapes and variable-length tag arrays stay in one
 * rectangular column each.
 */
import type { ExportRow } from './export-row';

/** The column order for CSV export (R10.2). */
export const CSV_COLUMNS = [
  'id',
  'type',
  'status',
  'createdAt',
  'updatedAt',
  'read',
  'payload',
  'notes',
  'tags',
] as const;

/**
 * RFC 4180 field escaping.
 *
 * A field is quoted if and only if it contains `"`, `,`, `\r`, or `\n`.
 * Embedded `"` characters are doubled inside the quoted form.
 */
export function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

/** Convert a single ExportRow field to its string cell value. */
function toCell(row: ExportRow, column: (typeof CSV_COLUMNS)[number]): string {
  switch (column) {
    case 'id':
      return row.id;
    case 'type':
      return row.type;
    case 'status':
      return row.status;
    case 'createdAt':
      return row.createdAt;
    case 'updatedAt':
      return row.updatedAt;
    case 'read':
      return row.read ? 'true' : 'false';
    case 'payload':
      return JSON.stringify(row.payload);
    case 'notes':
      return row.notes;
    case 'tags':
      return JSON.stringify(row.tags);
  }
}

/**
 * Produce a full RFC 4180 CSV string from an array of ExportRow values.
 *
 * - Header row first (CSV_COLUMNS joined with commas, CRLF-terminated).
 * - Each data row: values in column order, escaped per RFC 4180.
 * - Each row terminated with CRLF.
 * - Empty array produces a header-only output (one CRLF-terminated line).
 */
export function toCsv(rows: readonly ExportRow[]): string {
  const header = CSV_COLUMNS.join(',');
  const lines = rows.map((row) =>
    CSV_COLUMNS.map((col) => escapeCsvField(toCell(row, col))).join(','),
  );
  return [header, ...lines].map((line) => line + '\r\n').join('');
}
