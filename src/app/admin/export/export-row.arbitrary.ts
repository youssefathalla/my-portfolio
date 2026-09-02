/**
 * Shared fast-check arbitrary for `ExportRow` (admin-dashboard R10.6, R10.7).
 *
 * Reused by both the CSV and JSON property specs so both round-trip properties
 * are exercised over the identical input space. String fields deliberately
 * include commas, double quotes, CR, LF, CRLF pairs, and arbitrary Unicode to
 * stress RFC 4180 escaping and JSON serialization boundaries.
 */
import fc from 'fast-check';

import type { ExportRow } from './export-row';

/**
 * A string arbitrary that deliberately produces characters hostile to CSV and
 * JSON serializers: commas, double quotes, carriage returns, line feeds, CRLF
 * pairs, and full Unicode.
 */
const nastyString: fc.Arbitrary<string> = fc.oneof(
  fc.string({ unit: 'binary' }),
  fc.stringMatching(/[",\r\n]+/),
  fc.constantFrom(
    '',
    '"',
    ',',
    '\r\n',
    '\n',
    '\r',
    '","',
    'hello, "world"',
    'line1\r\nline2\nline3\rline4',
    '\u00e9\u00e8\u00ea', // accented chars
    '\u{1F600}\u{1F4A9}', // emoji
    'field\twith\ttabs',
    '   leading and trailing   ',
  ),
);

/** A non-empty nasty string suitable for object keys. */
const nastyKey: fc.Arbitrary<string> = fc.oneof(
  fc.string({ minLength: 1, maxLength: 20 }),
  fc.constantFrom(
    'name',
    'email',
    'key,with,commas',
    'key"with"quotes',
    'key\nwith\nnewlines',
  ),
);

/**
 * Shared `ExportRow` arbitrary for property-based tests (R10.6, R10.7).
 *
 * Every string-valued field draws from a nasty-string generator covering the
 * characters that RFC 4180 escaping and JSON serialization must handle correctly.
 */
export const arbitraryExportRow: fc.Arbitrary<ExportRow> = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('contact' as const, 'intake-wizard' as const, 'booking' as const),
  status: fc.constantFrom('new' as const, 'in-progress' as const, 'archived' as const, 'spam' as const),
  createdAt: fc.date({ min: new Date('1970-01-01'), max: new Date('2100-12-31') }).map((d) => d.toISOString()),
  updatedAt: fc.date({ min: new Date('1970-01-01'), max: new Date('2100-12-31') }).map((d) => d.toISOString()),
  read: fc.boolean(),
  payload: fc.dictionary(nastyKey, fc.oneof(nastyString, fc.integer(), fc.boolean()), {
    minKeys: 0,
    maxKeys: 8,
  }) as fc.Arbitrary<Readonly<Record<string, string | number | boolean>>>,
  notes: nastyString,
  tags: fc.array(nastyString, { minLength: 0, maxLength: 6 }),
});
