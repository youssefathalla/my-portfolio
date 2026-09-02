import '@angular/compiler';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { DEFAULT_LOCALE, LOCALES } from '../i18n/locale';
import type { Locale } from '../i18n/locale';
import { ROUTE_MANIFEST, toCanonicalUrl, type RouteMetadata } from '../routing/route-manifest';
import { SeoService } from './seo.service';

/**
 * A real Route_Manifest key (services-hub) so `#setAlternateLinks` finds a
 * manifest entry and renders a real hreflang link set rather than
 * returning early on an unknown key.
 */
const ROUTE_KEY = 'services-hub';

const METADATA: RouteMetadata = {
  title: 'Test Title',
  description: 'Test description text.',
  canonicalPath: 'services',
  socialImagePath: '/og/test.png',
};

function expectedCanonicalUrl(): string {
  return toCanonicalUrl(METADATA.canonicalPath, environment.baseUrl);
}

function expectedOgImageUrl(): string {
  return new URL(METADATA.socialImagePath, environment.baseUrl).toString();
}

function expectedAlternateHrefs(): ReadonlyMap<string, string> {
  const entry = ROUTE_MANIFEST.find((e) => e.key === ROUTE_KEY);
  if (!entry) {
    throw new Error(`Route_Manifest has no entry keyed "${ROUTE_KEY}" — fixture assumption broken.`);
  }
  const hrefByHreflang = new Map<string, string>();
  let defaultLocaleUrl = '';
  for (const locale of LOCALES) {
    const url = toCanonicalUrl(entry.metadata[locale].canonicalPath, environment.baseUrl);
    hrefByHreflang.set(locale, url);
    if (locale === DEFAULT_LOCALE) {
      defaultLocaleUrl = url;
    }
  }
  hrefByHreflang.set('x-default', defaultLocaleUrl);
  return hrefByHreflang;
}

/** Every element/attribute this service owns, so tests don't leak into each other. */
function cleanupSeoDom(): void {
  document
    .querySelectorAll(
      [
        'link[rel="canonical"]',
        'link[rel="alternate"][hreflang]',
        'meta[name="description"]',
        'meta[name="robots"]',
        'meta[property^="og:"]',
        'meta[name^="twitter:"]',
        'script[data-seo]',
      ].join(','),
    )
    .forEach((el) => el.remove());
  document.title = '';
}

describe('SeoService', () => {
  beforeEach(() => {
    cleanupSeoDom();
  });

  afterEach(() => {
    cleanupSeoDom();
  });

  it('sets all five og:* tags from a RouteMetadata (R13.3)', () => {
    const service = TestBed.inject(SeoService);

    service.initRoute(METADATA, ROUTE_KEY, 'en');

    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(METADATA.title);
    expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe(
      METADATA.description,
    );
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('website');
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(expectedCanonicalUrl());
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      expectedOgImageUrl(),
    );
  });

  it('sets all four twitter:* tags mirroring the og:* values (R13.4)', () => {
    const service = TestBed.inject(SeoService);

    service.initRoute(METADATA, ROUTE_KEY, 'en');

    expect(document.querySelector('meta[name="twitter:card"]')?.getAttribute('content')).toBe(
      'summary_large_image',
    );
    expect(document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')).toBe(METADATA.title);
    expect(document.querySelector('meta[name="twitter:description"]')?.getAttribute('content')).toBe(
      METADATA.description,
    );
    expect(document.querySelector('meta[name="twitter:image"]')?.getAttribute('content')).toBe(
      expectedOgImageUrl(),
    );
  });

  it('emits a locale-independent hreflang link set for the same route (R13.5, R13.6)', () => {
    const expected = expectedAlternateHrefs();

    const englishRun = TestBed.inject(SeoService);
    englishRun.initRoute(METADATA, ROUTE_KEY, 'en');
    const linksAfterEnglish = new Map(
      Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')).map((link) => [
        link.getAttribute('hreflang') ?? '',
        link.getAttribute('href') ?? '',
      ]),
    );

    cleanupSeoDom();

    const arabicRun = TestBed.inject(SeoService);
    arabicRun.initRoute(METADATA, ROUTE_KEY, 'ar');
    const linksAfterArabic = new Map(
      Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')).map((link) => [
        link.getAttribute('hreflang') ?? '',
        link.getAttribute('href') ?? '',
      ]),
    );

    // One link per Locale plus one x-default.
    expect(linksAfterEnglish.size).toBe(LOCALES.length + 1);
    expect(linksAfterArabic.size).toBe(LOCALES.length + 1);

    // Same hreflang/href pairs regardless of which Locale was active.
    expect(linksAfterEnglish).toEqual(linksAfterArabic);
    expect(linksAfterEnglish).toEqual(expected);

    for (const locale of [...LOCALES, 'x-default'] as readonly (Locale | 'x-default')[]) {
      expect(linksAfterEnglish.get(locale)).toBe(expected.get(locale));
    }
  });

  it('sets robots noindex on a not-found route and clears it on the next real route (R13.7, R13.8, R13.9)', () => {
    const service = TestBed.inject(SeoService);

    service.initNotFound('Not Found');
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex');

    service.initRoute(METADATA, ROUTE_KEY, 'en');
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('updates every owned element in place rather than duplicating it on re-render (R13.10, R13.11)', () => {
    const service = TestBed.inject(SeoService);

    service.initRoute(METADATA, ROUTE_KEY, 'en');
    service.initRoute(METADATA, ROUTE_KEY, 'en');

    expect(document.title).toBe(METADATA.title);
    expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(document.head.querySelectorAll('meta[property="og:title"]').length).toBe(1);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(expectedCanonicalUrl());

    service.initLanding('en');
    service.initLanding('en');

    expect(document.head.querySelectorAll('script[data-seo="person"]').length).toBe(1);
  });
});
