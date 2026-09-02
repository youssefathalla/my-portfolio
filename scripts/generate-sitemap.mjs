#!/usr/bin/env node
/**
 * Generates public/sitemap.xml from ROUTE_MANIFEST and supported locales before builds.
 * Includes canonical URLs, hreflang alternates for each locale, and x-default entries.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const ENVIRONMENT_TS_PATH = join(ROOT, 'src', 'environments', 'environment.prod.ts');
const ROUTE_MANIFEST_TS_PATH = join(ROOT, 'src', 'app', 'core', 'routing', 'route-manifest.ts');
const LOCALE_TS_PATH = join(ROOT, 'src', 'app', 'core', 'i18n', 'locale.ts');
const SITEMAP_PATH = join(ROOT, 'public', 'sitemap.xml');

/** Extracts the `baseUrl: '...'` literal from `environment.prod.ts` without compiling TS. */
function readBaseUrl() {
  const src = readFileSync(ENVIRONMENT_TS_PATH, 'utf8');
  const match = src.match(/baseUrl\s*:\s*['"]([^'"]+)['"]/);
  if (!match) {
    throw new Error(`could not find baseUrl literal in ${ENVIRONMENT_TS_PATH}`);
  }
  return match[1];
}

/** Extracts the LOCALES array literal from locale.ts without compiling TypeScript. */
function readLocales() {
  const src = readFileSync(LOCALE_TS_PATH, 'utf8');
  const match = src.match(/export\s+const\s+LOCALES[^=]*=\s*\[([^\]]+)\]/);
  if (!match) {
    throw new Error(`could not find "export const LOCALES" array literal in ${LOCALE_TS_PATH}`);
  }
  const locales = [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
  if (locales.length === 0) {
    throw new Error(
      `found zero locale entries inside the LOCALES array literal in ${LOCALE_TS_PATH}`,
    );
  }
  return locales;
}

/** Extracts the DEFAULT_LOCALE value from locale.ts without compiling TypeScript. */
function readDefaultLocale() {
  const src = readFileSync(LOCALE_TS_PATH, 'utf8');
  const match = src.match(/export\s+const\s+DEFAULT_LOCALE[^=]*=\s*['"]([^'"]+)['"]/);
  if (!match) {
    throw new Error(`could not find "export const DEFAULT_LOCALE" literal in ${LOCALE_TS_PATH}`);
  }
  return match[1];
}

/** Extracts all manifest route paths in file order from route-manifest.ts. */
function readRouteManifestPaths() {
  const src = readFileSync(ROUTE_MANIFEST_TS_PATH, 'utf8');

  const declarationStart = src.indexOf('export const ROUTE_MANIFEST');
  if (declarationStart === -1) {
    throw new Error(`could not find "export const ROUTE_MANIFEST" in ${ROUTE_MANIFEST_TS_PATH}`);
  }

  const equalsSign = src.indexOf('=', declarationStart);
  if (equalsSign === -1) {
    throw new Error(
      `could not find "=" after the ROUTE_MANIFEST declaration in ${ROUTE_MANIFEST_TS_PATH}`,
    );
  }

  const bracketStart = src.indexOf('[', equalsSign);
  if (bracketStart === -1) {
    throw new Error(
      `could not find start of ROUTE_MANIFEST array literal in ${ROUTE_MANIFEST_TS_PATH}`,
    );
  }

  let depth = 0;
  let bracketEnd = -1;
  for (let i = bracketStart; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') {
      depth--;
      if (depth === 0) {
        bracketEnd = i;
        break;
      }
    }
  }
  if (bracketEnd === -1) {
    throw new Error(
      `could not find end of ROUTE_MANIFEST array literal in ${ROUTE_MANIFEST_TS_PATH}`,
    );
  }

  const arrayLiteral = src.slice(bracketStart, bracketEnd + 1);
  const paths = [...arrayLiteral.matchAll(/path:\s*'([^']*)'/g)].map((match) => match[1]);

  if (paths.length === 0) {
    throw new Error(
      `found zero "path: '...'" entries inside the ROUTE_MANIFEST array literal in ${ROUTE_MANIFEST_TS_PATH}`,
    );
  }

  return paths;
}

/** Prepends the locale prefix for non-default locales. */
function toLocalizedPath(path, locale, defaultLocale) {
  if (locale === defaultLocale) {
    return path;
  }
  return path === '' ? locale : `${locale}/${path}`;
}

/** Constructs the full canonical URL with base URL. */
function toCanonicalUrl(path, baseUrl) {
  return path === '' ? `${baseUrl}/` : `${baseUrl}/${path}`;
}

/** Today's date in UTC as YYYY-MM-DD. */
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const baseUrl = readBaseUrl();
const paths = readRouteManifestPaths();
const locales = readLocales();
const defaultLocale = readDefaultLocale();
const lastmod = todayIso();

// Builds <url> entries with canonical location, hreflang alternates, and lastmod timestamp
const urlEntries = paths
  .flatMap((path) =>
    locales.map((locale) => {
      const localizedPath = toLocalizedPath(path, locale, defaultLocale);
      const loc = toCanonicalUrl(localizedPath, baseUrl);

      // Build alternate links — one per locale plus x-default
      const alternateLinks = locales
        .map((altLocale) => {
          const altPath = toLocalizedPath(path, altLocale, defaultLocale);
          const altUrl = toCanonicalUrl(altPath, baseUrl);
          return `    <xhtml:link rel="alternate" hreflang="${altLocale}" href="${altUrl}"/>`;
        })
        .join('\n');

      const defaultUrl = toCanonicalUrl(
        toLocalizedPath(path, defaultLocale, defaultLocale),
        baseUrl,
      );
      const xDefaultLink = `    <xhtml:link rel="alternate" hreflang="x-default" href="${defaultUrl}"/>`;

      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
${alternateLinks}
${xDefaultLink}
  </url>`;
    }),
  )
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}
</urlset>
`;

writeFileSync(SITEMAP_PATH, xml, 'utf8');
const entryCount = paths.length * locales.length;
const locLines = paths
  .flatMap((path) =>
    locales.map((locale) => {
      const localizedPath = toLocalizedPath(path, locale, defaultLocale);
      return `    - ${toCanonicalUrl(localizedPath, baseUrl)}`;
    }),
  )
  .join('\n');
console.log(
  `Generated ${SITEMAP_PATH}\n  baseUrl: ${baseUrl}\n  lastmod: ${lastmod}\n  locales: ${locales.join(', ')}\n  entries: ${entryCount}\n${locLines}`,
);
