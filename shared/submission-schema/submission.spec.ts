import fc from 'fast-check';

import {
  areSubmissionDocumentsEqual,
  fromFirestoreReadRepresentation,
  isValidPayloadForType,
  isValidSubmissionDocument,
  toFirestoreWriteRepresentation,
  type SubmissionDocument,
  type SubmissionType,
} from './submission';

/** Timestamp-like stand-in used in place of a real Firestore Timestamp. */
interface TimestampLike {
  toMillis(): number;
}

const timestampLikeArb = (): fc.Arbitrary<TimestampLike> =>
  fc
    .date({ min: new Date(0), max: new Date(2_500_000_000_000), noInvalidDate: true })
    .map((d) => ({
      toMillis: () => d.getTime(),
    }));

const compareTimestamps = (t1: unknown, t2: unknown): boolean =>
  (t1 as TimestampLike).toMillis() === (t2 as TimestampLike).toMillis();

const resolveTimestamp = (v: unknown): unknown => v;

const submissionDocumentArb = (): fc.Arbitrary<SubmissionDocument> =>
  fc.record({
    type: fc.constantFrom<SubmissionType>('contact', 'intake-wizard', 'booking'),
    status: fc.constantFrom('new', 'in-progress', 'archived', 'spam'),
    createdAt: timestampLikeArb(),
    updatedAt: timestampLikeArb(),
    read: fc.boolean(),
    payload: fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer(), fc.boolean())),
    notes: fc.string(),
    tags: fc.array(fc.string()),
  });

describe('submission schema', () => {
  describe('Feature: portfolio-merge, Property 3: Submission document Firestore round trip', () => {
    it('preserves a SubmissionDocument through write/read round trip', () => {
      fc.assert(
        fc.property(submissionDocumentArb(), (doc) => {
          const written = toFirestoreWriteRepresentation(doc);
          const readBack = fromFirestoreReadRepresentation(written, resolveTimestamp);

          expect(areSubmissionDocumentsEqual(doc, readBack, compareTimestamps)).toBe(true);
        }),
      );
    });
  });

  describe('Feature: portfolio-merge, Property 6: isValidSubmissionDocument rejects malformed documents', () => {
    const validTimestampLike = (): TimestampLike => ({ toMillis: () => Date.now() });
    const isTimestampLike = (v: unknown): boolean =>
      typeof v === 'object' && v !== null && typeof (v as TimestampLike).toMillis === 'function';

    const validShapedRecord = (): Record<string, unknown> => ({
      type: 'contact',
      status: 'new',
      createdAt: validTimestampLike(),
      updatedAt: validTimestampLike(),
      read: false,
      payload: { name: 'Jane' },
      notes: '',
      tags: [],
    });

    const requiredKeys = [
      'type',
      'status',
      'createdAt',
      'updatedAt',
      'read',
      'payload',
      'notes',
      'tags',
    ] as const;

    const missingKeyArb = (): fc.Arbitrary<Record<string, unknown>> =>
      fc.constantFrom(...requiredKeys).map((key) => {
        const record = validShapedRecord();
        delete record[key];
        return record;
      });

    const extraKeyArb = (): fc.Arbitrary<Record<string, unknown>> =>
      fc.string().map((extraKey) => {
        const record = validShapedRecord();
        // Guarantee the extra key does not collide with a required key.
        record[`__extra__${extraKey}`] = 'extra-value';
        return record;
      });

    const invalidTypeArb = (): fc.Arbitrary<Record<string, unknown>> =>
      fc
        .string()
        .filter((s) => !(['contact', 'intake-wizard', 'booking'] as string[]).includes(s))
        .map((badType) => ({ ...validShapedRecord(), type: badType }));

    const nonBooleanReadArb = (): fc.Arbitrary<Record<string, unknown>> =>
      fc
        .oneof(fc.string(), fc.integer(), fc.constant(null), fc.constant(undefined))
        .map((badRead) => ({ ...validShapedRecord(), read: badRead }));

    const nestedPayloadArb = (): fc.Arbitrary<Record<string, unknown>> =>
      fc
        .oneof(
          fc.dictionary(fc.string(), fc.object(), { minKeys: 1 }),
          fc.dictionary(fc.string(), fc.array(fc.string()), { minKeys: 1 }),
        )
        .map((badPayload) => ({ ...validShapedRecord(), payload: badPayload }));

    const malformedDocumentArb = (): fc.Arbitrary<unknown> =>
      fc.oneof(
        missingKeyArb(),
        extraKeyArb(),
        invalidTypeArb(),
        nonBooleanReadArb(),
        nestedPayloadArb(),
        fc.constant(null),
        fc.constant(undefined),
        fc.constant(42),
        fc.constant('string'),
        fc.constant([]),
      );

    it('returns false for every malformed document', () => {
      fc.assert(
        fc.property(malformedDocumentArb(), (value) => {
          expect(isValidSubmissionDocument(value, isTimestampLike)).toBe(false);
        }),
      );
    });
  });

  describe("Feature: portfolio-merge, Property 7: isValidPayloadForType rejects payloads violating their type's shape", () => {
    const entryCountByType: Readonly<Record<SubmissionType, number>> = {
      contact: 4,
      'intake-wizard': 6,
      booking: 7,
    };

    const wrongEntryCountArb = (): fc.Arbitrary<[SubmissionType, Record<string, unknown>]> =>
      fc
        .constantFrom<SubmissionType>('contact', 'intake-wizard', 'booking')
        .chain((type) => {
          const expected = entryCountByType[type];
          return fc
            .integer({ min: 0, max: expected + 3 })
            .filter((count) => count !== expected)
            .map((count): [SubmissionType, Record<string, unknown>] => {
              const payload: Record<string, unknown> = {};
              for (let i = 0; i < count; i++) {
                payload[`key${i}`] = 'value';
              }
              return [type, payload];
            });
        });

    const invalidValueTypeArb = (): fc.Arbitrary<[SubmissionType, unknown]> =>
      fc.constantFrom<SubmissionType>('contact', 'intake-wizard', 'booking').chain((type) => {
        const expected = entryCountByType[type];
        const badValueArb =
          type === 'booking'
            ? fc.oneof(fc.constant(null), fc.object(), fc.array(fc.string()))
            : // contact / intake-wizard require string values only, so a number,
              // boolean, null, object, or array in any slot is a violation.
              fc.oneof(
                fc.integer(),
                fc.boolean(),
                fc.constant(null),
                fc.object(),
                fc.array(fc.string()),
              );

        return badValueArb.map((badValue): [SubmissionType, unknown] => {
          const payload: Record<string, unknown> = {};
          for (let i = 0; i < expected - 1; i++) {
            payload[`key${i}`] = 'value';
          }
          payload[`key${expected - 1}`] = badValue;
          return [type, payload];
        });
      });

    const violatingPayloadArb = (): fc.Arbitrary<[SubmissionType, unknown]> =>
      fc.oneof(wrongEntryCountArb(), invalidValueTypeArb());

    it("returns false for every payload violating its type's shape", () => {
      fc.assert(
        fc.property(violatingPayloadArb(), ([type, payload]) => {
          expect(isValidPayloadForType(type, payload)).toBe(false);
        }),
      );
    });
  });
});
