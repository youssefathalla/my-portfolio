import fc from 'fast-check';
import { isConfiguredUrl } from './url.utils';

describe('isConfiguredUrl', () => {
  describe('blank and nullish values', () => {
    it.each([
      ['an empty string', ''],
      ['a single space', ' '],
      ['tabs and newlines only', '\t\n  \t'],
    ])('returns false for %s', (_label, value) => {
      expect(isConfiguredUrl(value)).toBe(false);
    });

    it('returns false for null', () => {
      expect(isConfiguredUrl(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isConfiguredUrl(undefined)).toBe(false);
    });
  });

  describe('the 2048-character length boundary', () => {
    const toHttpsUrlOfLength = (length: number): string => {
      const prefix = 'https://example.com/';
      return prefix + 'a'.repeat(Math.max(0, length - prefix.length));
    };

    it('returns true for a valid https URL exactly 2048 characters long', () => {
      const url = toHttpsUrlOfLength(2048);
      expect(url).toHaveLength(2048);
      expect(isConfiguredUrl(url)).toBe(true);
    });

    it('returns false for an otherwise valid https URL of 2049 characters', () => {
      const url = toHttpsUrlOfLength(2049);
      expect(url).toHaveLength(2049);
      expect(isConfiguredUrl(url)).toBe(false);
    });

    it('returns false for a string far beyond 2048 characters', () => {
      const url = toHttpsUrlOfLength(5000);
      expect(isConfiguredUrl(url)).toBe(false);
    });
  });

  describe('scheme classification', () => {
    it('returns false for http:// URLs', () => {
      expect(isConfiguredUrl('http://example.com')).toBe(false);
    });

    it('returns false for protocol-relative URLs', () => {
      expect(isConfiguredUrl('//example.com')).toBe(false);
    });

    it('returns false for malformed URLs', () => {
      expect(isConfiguredUrl('not a url')).toBe(false);
    });

    it('returns false for a bare domain with no scheme', () => {
      expect(isConfiguredUrl('example.com')).toBe(false);
    });

    it('returns true for a plain https:// URL', () => {
      expect(isConfiguredUrl('https://example.com')).toBe(true);
    });
  });

  describe('property: valid https URLs of varying length classify as configured', () => {
    it('classifies every well-formed https URL under 2048 characters as true', () => {
      fc.assert(
        fc.property(
          fc.webAuthority({ withIPv4: false, withPort: false }),
          fc.array(fc.webSegment(), { maxLength: 20 }),
          (authority, segments) => {
            const url = `https://${authority}/${segments.join('/')}`;
            fc.pre(url.length > 0 && url.length <= 2048);

            expect(isConfiguredUrl(url)).toBe(true);
          },
        ),
      );
    });

    it('classifies every well-formed http URL as false regardless of length', () => {
      fc.assert(
        fc.property(
          fc.webAuthority({ withIPv4: false, withPort: false }),
          fc.array(fc.webSegment(), { maxLength: 20 }),
          (authority, segments) => {
            const url = `http://${authority}/${segments.join('/')}`;
            fc.pre(url.length <= 2048);

            expect(isConfiguredUrl(url)).toBe(false);
          },
        ),
      );
    });
  });
});
