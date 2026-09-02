import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

import { DEFAULT_LOCALE, LOCALES } from '../i18n/locale';
import type { Locale } from '../i18n/locale';
import { toLocalizedPath, toManifestPath } from './path-encoder';
import { ROUTE_MANIFEST } from './route-manifest';

const pathArb = (): fc.Arbitrary<string> => fc.constantFrom(...ROUTE_MANIFEST.map((entry) => entry.path));

const localeArb = (): fc.Arbitrary<Locale> => fc.constantFrom(...LOCALES);

describe('Path_Encoder', () => {
  describe('Feature: portfolio-merge, Property 1: Path encode-then-decode round trip', () => {
    it('recovers the original path and locale after encoding then decoding', () => {
      fc.assert(
        fc.property(fc.tuple(pathArb(), localeArb()), ([path, locale]) => {
          const localizedPath = toLocalizedPath(path, locale);
          const decoded = toManifestPath(localizedPath);

          expect(decoded).toEqual({ locale, path });
        }),
      );
    });
  });

  describe('Feature: portfolio-merge, Property 2: Localized-path decode-then-encode round trip', () => {
    const localizedPathArb = (): fc.Arbitrary<string> =>
      fc.tuple(pathArb(), localeArb()).map(([path, locale]) => toLocalizedPath(path, locale));

    it('recovers the original localized path after decoding then encoding', () => {
      fc.assert(
        fc.property(localizedPathArb(), (localizedPath) => {
          const { path, locale } = toManifestPath(localizedPath);
          const reencoded = toLocalizedPath(path, locale);

          expect(reencoded).toBe(localizedPath);
        }),
      );
    });
  });
});

describe('toManifestPath — unmatched-input unit test (R12.5)', () => {
  it.each([
    '', // empty string — explicitly required by R12.5
    'services', // plain path, no locale prefix
    'services/turnkey',
    'arabic-something', // resembles 'ar' as a prefix, not an exact segment match
    'arabic/foo',
    'ar-something/foo', // 'ar-something' !== 'ar' — first segment must match exactly
    'Ar/foo', // case-sensitive: 'Ar' !== 'ar'
    'AR',
  ])('returns { locale: DEFAULT_LOCALE, path } unchanged for %j', (input) => {
    expect(toManifestPath(input)).toEqual({ locale: DEFAULT_LOCALE, path: input });
  });

  it('raises zero error for any string input, including the empty string', () => {
    expect(() => toManifestPath('')).not.toThrow();
  });
});
