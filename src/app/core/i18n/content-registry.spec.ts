import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

import { isCompleteLocaleRecord } from './content-registry';
import { ROUTE_MANIFEST } from '../routing/route-manifest';

export interface LeafPathEntry {
  readonly path: string;
  readonly type: string;
  readonly value: unknown;
}

/**
 * Recursively collects all leaf paths and their primitive types from an arbitrary value.
 */
export function collectLeafPaths(value: unknown, path = ''): LeafPathEntry[] {
  if (value === null || typeof value !== 'object') {
    return [{ path, type: typeof value, value }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, idx) => collectLeafPaths(item, `${path}[${idx}]`));
  }
  return Object.keys(value as Record<string, unknown>).flatMap((k) =>
    collectLeafPaths((value as Record<string, unknown>)[k], path ? `${path}.${k}` : k),
  );
}

/**
 * All content registries that must pass locale-completeness and
 * structural-completeness verification.
 */
const REGISTRIES: readonly { name: string; registry: unknown }[] = [
  ...ROUTE_MANIFEST.map((entry) => ({ name: `METADATA_${entry.key}`, registry: entry.metadata })),
];

/**
 * Leaf paths and strings that legitimately stay Latin-only despite their en
 * counterpart containing a space (brand/personal names, technical terms).
 * Each entry has a one-line reason so adding an exemption is a visible,
 * reviewable act rather than a silently loosened assertion.
 */
const LATIN_ONLY_EXEMPTIONS: ReadonlySet<string> = new Set([
  // *_METADATA titles — brand / personal name stays in Latin script within
  // an otherwise-Arabic title (e.g. "Youssef Fathalla | مهندس ...").
  'Youssef Fathalla',
]);

describe('Content registries — structural completeness (R6.14, R6.18)', () => {
  describe.each(REGISTRIES)('$name', ({ name, registry }) => {
    it('passes isCompleteLocaleRecord', () => {
      expect(isCompleteLocaleRecord(registry)).toBe(true);
    });

    it('has identical structure in en and ar branches with non-empty strings', () => {
      const rec = registry as Record<string, unknown>;
      const enLeaves = collectLeafPaths(rec['en']);
      const arLeaves = collectLeafPaths(rec['ar']);

      const enStructure = enLeaves.map((l) => `${l.path}:${l.type}`);
      const arStructure = arLeaves.map((l) => `${l.path}:${l.type}`);

      expect(arStructure).toEqual(enStructure);

      // Verify all Arabic strings are non-empty
      for (const leaf of arLeaves) {
        if (leaf.type === 'string') {
          expect((leaf.value as string).trim().length).toBeGreaterThan(0);
        }
      }
    });

    it('has ar content that is actually translated, not cloned English', () => {
      const rec = registry as Record<string, unknown>;
      const enLeaves = collectLeafPaths(rec['en']);
      const arLeaves = collectLeafPaths(rec['ar']);

      const enStrings = enLeaves.filter((l) => l.type === 'string').map((l) => l.value as string);
      const arStrings = arLeaves.filter((l) => l.type === 'string').map((l) => l.value as string);

      // The ar sequence must differ from the en sequence (not a clone).
      expect(arStrings).not.toEqual(enStrings);

      // Every ar leaf whose en counterpart contains a space must contain
      // at least one Arabic-script character, unless it is in the Latin-only exemption set.
      for (let i = 0; i < enStrings.length; i++) {
        const enStr = enStrings[i];
        const arStr = arStrings[i];
        const leafPath = arLeaves.filter((l) => l.type === 'string')[i]?.path ?? '';

        if (
          enStr.includes(' ') &&
          !LATIN_ONLY_EXEMPTIONS.has(leafPath) &&
          !LATIN_ONLY_EXEMPTIONS.has(arStr)
        ) {
          expect(
            /[\u0600-\u06FF]/u.test(arStr),
            `${name} ${leafPath}: ar leaf "${arStr}" should contain Arabic-script characters`,
          ).toBe(true);
        }
      }
    });

    it('has no Eastern Arabic numerals in ar content', () => {
      const rec = registry as Record<string, unknown>;
      const arLeaves = collectLeafPaths(rec['ar']);

      for (const leaf of arLeaves) {
        if (leaf.type === 'string') {
          expect(
            /[\u0660-\u0669\u06F0-\u06F9]/u.test(leaf.value as string),
            `${name} ${leaf.path}: ar leaf should not contain Eastern Arabic numerals`,
          ).toBe(false);
        }
      }
    });
  });

  /**
   * Closed-set transliteration assertion. The transliteration space is
   * open, so this catches likely mistakes and makes no claim to
   * completeness. The general rule is human review.
   */
  const FORBIDDEN_TRANSLITERATIONS = ['أنجولار', 'تايب سكريبت', 'فايربيز'];

  describe('No Arabic transliteration of Latin technical terms', () => {
    it.each(REGISTRIES)('$name has no forbidden transliterations in ar branch', ({ registry }) => {
      const rec = registry as Record<string, unknown>;
      const arLeaves = collectLeafPaths(rec['ar']);

      for (const leaf of arLeaves) {
        if (leaf.type === 'string') {
          for (const forbidden of FORBIDDEN_TRANSLITERATIONS) {
            expect(
              (leaf.value as string).includes(forbidden),
              `${leaf.path}: ar leaf should not contain transliteration "${forbidden}" — use Latin script instead`,
            ).toBe(false);
          }
        }
      }
    });
  });

  it('Leaf-path collection determines structure uniquely', () => {
    fc.assert(
      fc.property(
        fc.jsonValue(),
        fc.string({ minLength: 1 }),
        (jsonVal, replacement) => {
          const originalLeaves = collectLeafPaths(jsonVal);
          const originalPathsAndTypes = originalLeaves.map((l) => `${l.path}:${l.type}`);

          function replaceStrings(v: unknown): unknown {
            if (typeof v === 'string') {
              return replacement;
            }
            if (Array.isArray(v)) {
              return v.map(replaceStrings);
            }
            if (v !== null && typeof v === 'object') {
              const res: Record<string, unknown> = Object.create(null);
              for (const k of Object.keys(v as Record<string, unknown>)) {
                Object.defineProperty(res, k, {
                  value: replaceStrings((v as Record<string, unknown>)[k]),
                  enumerable: true,
                  writable: true,
                  configurable: true,
                });
              }
              return res;
            }
            return v;
          }

          const modifiedVal = replaceStrings(jsonVal);
          const modifiedLeaves = collectLeafPaths(modifiedVal);
          const modifiedPathsAndTypes = modifiedLeaves.map((l) => `${l.path}:${l.type}`);

          expect(modifiedPathsAndTypes).toEqual(originalPathsAndTypes);
        },
      ),
      { numRuns: 100 },
    );
  });
});
