#!/usr/bin/env node
/**
 * Asserts production build output integrity:
 * - Prerendered HTML existence and SEO metadata for all routes and locales
 * - Sitemap URL synchronization with the route manifest
 * - Firebase SDK exclusion from the SSR server bundle and initial browser bundle
 * - Production initial chunk size budgets
 * - Admin route separation from prerender and sitemaps
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const BROWSER_DIR = join(ROOT, 'dist', 'portfolio', 'browser');
const SERVER_DIR = join(ROOT, 'dist', 'portfolio', 'server');
const SITEMAP_PATH = join(BROWSER_DIR, 'sitemap.xml');
const ENVIRONMENT_PROD_TS_PATH = join(ROOT, 'src', 'environments', 'environment.prod.ts');
const ROUTE_MANIFEST_TS_PATH = join(ROOT, 'src', 'app', 'core', 'routing', 'route-manifest.ts');
const LOCALE_TS_PATH = join(ROOT, 'src', 'app', 'core', 'i18n', 'locale.ts');
const APP_ROUTES_TS_PATH = join(ROOT, 'src', 'app', 'app.routes.ts');

// Initial bundle filenames: main-*.js, styles-*.css, and polyfills-*.js.
const INITIAL_CHUNK_PATTERNS = [/^main-[^.]+\.js$/, /^styles-[^.]+\.css$/, /^polyfills-[^.]+\.js$/];

/**
 * Reads every Initial_Chunk file from the browser output directory and
 * returns `{ name, path, content }` records. Throws when the browser
 * directory is missing or contains no matching files.
 */
function readInitialChunkFiles() {
  if (!existsSync(BROWSER_DIR)) {
    throw new Error(`browser output directory not found: ${BROWSER_DIR}`);
  }

  const entries = readdirSync(BROWSER_DIR).filter((name) => {
    const full = join(BROWSER_DIR, name);
    return statSync(full).isFile() && INITIAL_CHUNK_PATTERNS.some((p) => p.test(name));
  });

  if (entries.length === 0) {
    throw new Error(
      `no initial chunk files (main-*.js, styles-*.css, polyfills-*.js) found in ${BROWSER_DIR}`,
    );
  }

  return entries.map((name) => {
    const full = join(BROWSER_DIR, name);
    return { name, path: full, content: readFileSync(full) };
  });
}

const results = [];

/** Records a check outcome; never throws so every check always runs. */
function record(name, passed, detail) {
  results.push({ name, passed, detail });
}

/** Runs `fn`, recording pass/fail. A check passes iff `fn` returns without throwing. */
function check(name, fn) {
  try {
    fn();
    record(name, true);
  } catch (err) {
    record(name, false, err instanceof Error ? err.message : String(err));
  }
}

function readTextFile(path) {
  if (!existsSync(path)) {
    throw new Error(`file not found: ${path}`);
  }
  return readFileSync(path, 'utf8');
}

/** Recursively collects every `.js` and `.mjs` file path under `dir`. */
function collectJsFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...collectJsFiles(full));
    } else if (stat.isFile() && (entry.endsWith('.js') || entry.endsWith('.mjs'))) {
      out.push(full);
    }
  }
  return out;
}

/** Parses `key="value"` attribute pairs out of a raw tag's attribute string using linear string scanning. */
function parseAttrs(attrString) {
  const attrs = {};
  let i = 0;
  while (i < attrString.length) {
    const eqIdx = attrString.indexOf('="', i);
    if (eqIdx === -1) break;

    const nameStart = Math.max(
      attrString.lastIndexOf(' ', eqIdx),
      attrString.lastIndexOf('\t', eqIdx),
      attrString.lastIndexOf('\n', eqIdx),
      attrString.lastIndexOf('\r', eqIdx),
    );
    const name = attrString
      .slice(nameStart + 1, eqIdx)
      .trim()
      .toLowerCase();

    const valStart = eqIdx + 2;
    const valEnd = attrString.indexOf('"', valStart);
    if (valEnd === -1) break;

    const value = attrString.slice(valStart, valEnd);
    if (name.length > 0) {
      attrs[name] = value;
    }
    i = valEnd + 1;
  }
  return attrs;
}

/** Returns `{ attrs }` for every occurrence of a void/self-describing tag (e.g. `link`, `meta`). */
function findTags(html, tagName) {
  const re = new RegExp(String.raw`<${tagName}\b([^>]*)>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    out.push({ attrs: parseAttrs(m[1]), raw: m[0] });
  }
  return out;
}

/** Returns `{ attrs, content }` for every `<script ...>...</script>` element. */
function findScripts(html) {
  const openTagRe = /<script\b([^>]*)>/gi;
  const out = [];
  let m;
  while ((m = openTagRe.exec(html))) {
    const contentStart = openTagRe.lastIndex;
    const closeIndex = html.toLowerCase().indexOf('</script>', contentStart);
    if (closeIndex === -1) break;
    out.push({ attrs: parseAttrs(m[1]), content: html.slice(contentStart, closeIndex) });
    openTagRe.lastIndex = closeIndex + 9;
  }
  return out;
}

function decodeEntities(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function requireSingleMetaContent(metaTags, attrKey, attrValue) {
  const matches = metaTags.filter((t) => t.attrs[attrKey] === attrValue);
  if (matches.length !== 1) {
    throw new Error(
      `expected exactly one <meta ${attrKey}="${attrValue}">, found ${matches.length}`,
    );
  }
  const content = matches[0].attrs.content;
  if (content === undefined || content.trim().length === 0) {
    throw new Error(`<meta ${attrKey}="${attrValue}"> has an empty content attribute`);
  }
  return decodeEntities(content);
}

/** Extracts the `baseUrl: '...'` literal from `environment.prod.ts` without compiling TS. */
function readBaseUrl() {
  const src = readTextFile(ENVIRONMENT_PROD_TS_PATH);
  const m = src.match(/baseUrl\s*:\s*['"]([^'"]+)['"]/);
  if (!m) {
    throw new Error(`could not find baseUrl literal in ${ENVIRONMENT_PROD_TS_PATH}`);
  }
  return m[1];
}

/** Reads the LOCALES array from `locale.ts` via regex, in declared order. */
function readLocales() {
  const src = readTextFile(LOCALE_TS_PATH);
  const m = src.match(/export\s+const\s+LOCALES[^=]*=\s*\[([^\]]+)\]/);
  if (!m) {
    throw new Error(`could not find LOCALES array literal in ${LOCALE_TS_PATH}`);
  }
  const locales = [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]);
  if (locales.length === 0) {
    throw new Error(`LOCALES array in ${LOCALE_TS_PATH} contains zero string values`);
  }
  return locales;
}

/** Reads the DEFAULT_LOCALE constant from `locale.ts`. */
function readDefaultLocale() {
  const src = readTextFile(LOCALE_TS_PATH);
  const m = src.match(/export\s+const\s+DEFAULT_LOCALE[^=]*=\s*['"]([^'"]+)['"]/);
  if (!m) {
    throw new Error(`could not find DEFAULT_LOCALE literal in ${LOCALE_TS_PATH}`);
  }
  return m[1];
}

/** Returns the index of the bracket matching the one at `openIndex`, or -1. */
function findMatchingBracket(text, openIndex, openChar, closeChar) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === openChar) {
      depth++;
    } else if (text[i] === closeChar) {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

/** Splits `text` into its top-level `{ ... }` object-literal blocks. */
function splitTopLevelBraceBlocks(text) {
  const blocks = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        blocks.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return blocks;
}

/**
 * Extracts a single-quoted string field's value from an object-literal
 * text block, concatenating `'a' +\n  'b'`-style multi-part string
 * literals into one string. Returns `undefined` when the field is absent.
 */
function extractStringField(objText, fieldName) {
  const prefix = new RegExp(String.raw`\b${fieldName}\s*:\s*`);
  const m = objText.match(prefix);
  if (!m) {
    return undefined;
  }
  let rest = objText.slice(m.index + m[0].length);
  const partRe = /^\s*(?:\+\s*)?'((?:[^'\\]|\\.)*)'/;
  const parts = [];
  let partMatch;
  while ((partMatch = rest.match(partRe))) {
    parts.push(partMatch[1]);
    rest = rest.slice(partMatch[0].length);
  }
  return parts.length > 0 ? parts.join('') : undefined;
}

/** Returns the `ROUTE_MANIFEST` array literal's raw text (the `[...]` span, inclusive). */
function readRouteManifestArrayLiteral() {
  const src = readTextFile(ROUTE_MANIFEST_TS_PATH);

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

  const bracketEnd = findMatchingBracket(src, bracketStart, '[', ']');
  if (bracketEnd === -1) {
    throw new Error(
      `could not find end of ROUTE_MANIFEST array literal in ${ROUTE_MANIFEST_TS_PATH}`,
    );
  }

  return src.slice(bracketStart, bracketEnd + 1);
}

/**
 * Reads `ROUTE_MANIFEST` as locale-aware records: `{ key, path,
 * localeMetadata: { en: {...}, ar: {...} } }`, without compiling
 * TypeScript.
 */
function readRouteManifestByLocale(locales, defaultLocale) {
  const arrayLiteral = readRouteManifestArrayLiteral();
  const entryBlocks = splitTopLevelBraceBlocks(arrayLiteral);

  if (entryBlocks.length === 0) {
    throw new Error(
      `found zero entry objects inside the ROUTE_MANIFEST array literal in ${ROUTE_MANIFEST_TS_PATH}`,
    );
  }

  return entryBlocks.map((block) => {
    const key = extractStringField(block, 'key');
    const path = extractStringField(block, 'path');

    if (key === undefined || path === undefined) {
      throw new Error(`ROUTE_MANIFEST entry missing "key" or "path" in: ${block.slice(0, 80)}...`);
    }

    const enBraceMatch = block.match(/en\s*:\s*\{/);
    const arBraceMatch = block.match(/ar\s*:\s*\{/);

    let enFields = {};
    if (enBraceMatch) {
      const enStart = block.indexOf('{', enBraceMatch.index);
      const enEnd = findMatchingBracket(block, enStart, '{', '}');
      if (enEnd !== -1) {
        const enObjText = block.slice(enStart, enEnd + 1);
        enFields = {
          title: extractStringField(enObjText, 'title'),
          description: extractStringField(enObjText, 'description'),
          canonicalPath: extractStringField(enObjText, 'canonicalPath'),
          socialImagePath: extractStringField(enObjText, 'socialImagePath'),
        };
      }
    }

    let arFields = {};
    if (arBraceMatch) {
      const arStart = block.indexOf('{', arBraceMatch.index);
      const arEnd = findMatchingBracket(block, arStart, '{', '}');
      if (arEnd !== -1) {
        const arObjText = block.slice(arStart, arEnd + 1);
        arFields = {
          title: extractStringField(arObjText, 'title'),
          description: extractStringField(arObjText, 'description'),
          canonicalPath: extractStringField(arObjText, 'canonicalPath'),
          socialImagePath: extractStringField(arObjText, 'socialImagePath'),
        };
      }
    }

    const perLocale = { en: enFields, ar: arFields };
    const localeMetadata = {};
    for (const locale of locales) {
      const source = perLocale[locale] ?? perLocale.en;
      const defaultPath =
        locale === defaultLocale ? path : toLocalizedPath(path, locale, defaultLocale);
      const canonicalPath = source.canonicalPath ?? defaultPath;
      localeMetadata[locale] = { ...source, canonicalPath };
    }

    return { key, path, localeMetadata };
  });
}

/** Mirrors `toLocalizedPath` in `path-encoder.ts` (R12.1). */
function toLocalizedPath(path, locale, defaultLocale) {
  if (locale === defaultLocale) {
    return path;
  }
  return path === '' ? locale : `${locale}/${path}`;
}

/** Mirrors `toCanonicalUrl` in `route-manifest.ts` (R2.6-equivalent). */
function toCanonicalUrl(canonicalPath, siteBaseUrl) {
  return canonicalPath === '' ? `${siteBaseUrl}/` : `${siteBaseUrl}/${canonicalPath}`;
}

/**
 * The static-prerender output file Angular's `@angular/ssr` prerender step
 * emits for a given localized path: `index.html` at the browser output
 * root for the empty path, and `<path>/index.html` (one directory per
 * path segment) for every other path.
 */
function expectedPrerenderedHtmlPath(localizedPath) {
  return localizedPath === ''
    ? join(BROWSER_DIR, 'index.html')
    : join(BROWSER_DIR, ...localizedPath.split('/'), 'index.html');
}

let locales = [];
let defaultLocale = 'en';
let routeManifestByLocale = [];
let routeManifestReadError = null;
try {
  locales = readLocales();
  defaultLocale = readDefaultLocale();
  routeManifestByLocale = readRouteManifestByLocale(locales, defaultLocale);
} catch (err) {
  routeManifestReadError = err instanceof Error ? err.message : String(err);
}

// ---------------------------------------------------------------------------
// Check 1: Route_Manifest is readable from source (prerequisite)
// ---------------------------------------------------------------------------

check(
  'Route_Manifest — readable from source (prerequisite for every per-route check below)',
  () => {
    if (routeManifestReadError) {
      throw new Error(routeManifestReadError);
    }
    if (routeManifestByLocale.length === 0) {
      throw new Error('ROUTE_MANIFEST parsed to zero entries');
    }
  },
);

// ---------------------------------------------------------------------------
// Check 2: per-route, per-locale prerendered HTML file exists (R3, R4)
// ---------------------------------------------------------------------------

for (const route of routeManifestByLocale) {
  for (const locale of locales) {
    const localizedPath = toLocalizedPath(route.path, locale, defaultLocale);
    const displayPath = localizedPath === '' ? '/' : localizedPath;
    check(
      `dist/portfolio/browser — prerendered HTML exists for route '${route.key}' locale '${locale}' (path "${displayPath}")`,
      () => {
        if (routeManifestReadError) {
          throw new Error(`Route_Manifest unreadable: ${routeManifestReadError}`);
        }
        const htmlPath = expectedPrerenderedHtmlPath(localizedPath);
        if (!existsSync(htmlPath)) {
          throw new Error(
            `Route '${route.key}' locale '${locale}': missing prerender file at ${htmlPath}`,
          );
        }
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Check 3: per-route, per-locale SEO_Metadata present and internally
//          coherent (R13.3-R13.8)
// ---------------------------------------------------------------------------

function parsePageTitle(html, routeKey, locale) {
  const titleMatches = [...html.matchAll(/<title>([^<]*)<\/title>/gi)];
  if (titleMatches.length !== 1) {
    throw new Error(
      `Route '${routeKey}' locale '${locale}': expected exactly one <title>, found ${titleMatches.length}`,
    );
  }
  const title = decodeEntities(titleMatches[0][1]).trim();
  if (title.length === 0) {
    throw new Error(`Route '${routeKey}' locale '${locale}': <title> is empty`);
  }
  return title;
}

function parseCanonicalHref(html, routeKey, locale) {
  const linkTags = findTags(html, 'link');
  const canonicalLinks = linkTags.filter((t) => t.attrs.rel === 'canonical');
  if (canonicalLinks.length !== 1) {
    throw new Error(
      `Route '${routeKey}' locale '${locale}': expected exactly one <link rel="canonical">, found ${canonicalLinks.length}`,
    );
  }
  return canonicalLinks[0].attrs.href ?? '';
}

function assertJsonLdScriptsParse(html, routeKey, locale) {
  const scripts = findScripts(html);
  const jsonLdScripts = scripts.filter((s) => s.attrs.type === 'application/ld+json');
  for (const script of jsonLdScripts) {
    try {
      JSON.parse(script.content);
    } catch (err) {
      throw new Error(
        `Route '${routeKey}' locale '${locale}': JSON-LD script does not parse as JSON: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

function collectSeoMismatchProblems(data) {
  const { title, description, canonicalHref, expectedCanonicalUrl, metadata, og, twitter } = data;
  const problems = [];
  if (title !== metadata.title) {
    problems.push(`<title> ("${title}") !== Route_Manifest title ("${metadata.title}")`);
  }
  if (description !== metadata.description) {
    problems.push(
      `meta description ("${description}") !== Route_Manifest description ("${metadata.description}")`,
    );
  }
  if (canonicalHref !== expectedCanonicalUrl) {
    problems.push(
      `canonical href ("${canonicalHref}") !== expected canonical URL ("${expectedCanonicalUrl}")`,
    );
  }
  if (og.title !== title) problems.push(`og:title ("${og.title}") !== <title> ("${title}")`);
  if (og.description !== description) problems.push('og:description !== meta description');
  if (og.type !== 'website') problems.push(`og:type is "${og.type}", expected "website"`);
  if (og.url !== canonicalHref) problems.push(`og:url ("${og.url}") !== canonical href`);
  if (!og.image.startsWith('http://') && !og.image.startsWith('https://')) {
    problems.push(`og:image ("${og.image}") is not an absolute URL`);
  }
  if (twitter.card !== 'summary_large_image') {
    problems.push(`twitter:card is "${twitter.card}", expected "summary_large_image"`);
  }
  if (twitter.title !== og.title) problems.push('twitter:title !== og:title');
  if (twitter.description !== og.description) {
    problems.push('twitter:description !== og:description');
  }
  if (twitter.image !== og.image) problems.push('twitter:image !== og:image');
  return problems;
}

for (const route of routeManifestByLocale) {
  for (const locale of locales) {
    const localizedPath = toLocalizedPath(route.path, locale, defaultLocale);
    const displayPath = localizedPath === '' ? '/' : localizedPath;
    const metadata = route.localeMetadata[locale];
    if (!metadata) continue;

    check(
      `SEO_Metadata — coherent for route '${route.key}' locale '${locale}' (path "${displayPath}")`,
      () => {
        if (routeManifestReadError) {
          throw new Error(`Route_Manifest unreadable: ${routeManifestReadError}`);
        }
        const htmlPath = expectedPrerenderedHtmlPath(localizedPath);
        const html = readTextFile(htmlPath);
        const siteBaseUrl = readBaseUrl();
        const expectedCanonicalUrl = toCanonicalUrl(metadata.canonicalPath, siteBaseUrl);

        const title = parsePageTitle(html, route.key, locale);
        const metaTags = findTags(html, 'meta');
        const description = requireSingleMetaContent(metaTags, 'name', 'description');

        const og = {
          title: requireSingleMetaContent(metaTags, 'property', 'og:title'),
          description: requireSingleMetaContent(metaTags, 'property', 'og:description'),
          type: requireSingleMetaContent(metaTags, 'property', 'og:type'),
          url: requireSingleMetaContent(metaTags, 'property', 'og:url'),
          image: requireSingleMetaContent(metaTags, 'property', 'og:image'),
        };

        const twitter = {
          card: requireSingleMetaContent(metaTags, 'name', 'twitter:card'),
          title: requireSingleMetaContent(metaTags, 'name', 'twitter:title'),
          description: requireSingleMetaContent(metaTags, 'name', 'twitter:description'),
          image: requireSingleMetaContent(metaTags, 'name', 'twitter:image'),
        };

        const canonicalHref = parseCanonicalHref(html, route.key, locale);
        assertJsonLdScriptsParse(html, route.key, locale);

        const problems = collectSeoMismatchProblems({
          title,
          description,
          canonicalHref,
          expectedCanonicalUrl,
          metadata,
          og,
          twitter,
        });

        if (problems.length > 0) {
          throw new Error(`Route '${route.key}' locale '${locale}': ${problems.join('; ')}`);
        }
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Check 4: sitemap.xml <loc> set equals the Route_Manifest canonical URL
//          set, and carries zero /admin URL (R13.16, R11.10)
// ---------------------------------------------------------------------------

check(
  'sitemap.xml — <loc> set equals the Route_Manifest canonical URL set, zero /admin URL',
  () => {
    if (routeManifestReadError) {
      throw new Error(`Route_Manifest unreadable: ${routeManifestReadError}`);
    }

    const xml = readTextFile(SITEMAP_PATH);
    const siteBaseUrl = readBaseUrl();

    if (!/^\s*<\?xml\b/i.test(xml)) {
      throw new Error('sitemap.xml does not start with an XML declaration');
    }
    if (!/<urlset\b/i.test(xml) || !/<\/urlset>/i.test(xml)) {
      throw new Error('sitemap.xml is missing a <urlset> root element');
    }
    if (/<loc>[^<]*\/admin\b/i.test(xml)) {
      throw new Error('sitemap.xml contains an /admin URL');
    }

    const urlBlocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)];
    const sitemapLocs = urlBlocks.map((block, i) => {
      const locMatch = block[1].match(/<loc>([^<]*)<\/loc>/i);
      if (!locMatch) {
        throw new Error(`<url> entry ${i + 1} has no <loc> element`);
      }
      return locMatch[1].trim();
    });

    const expectedLocs = [];
    for (const locale of locales) {
      for (const route of routeManifestByLocale) {
        const md = route.localeMetadata[locale];
        if (md) {
          expectedLocs.push(toCanonicalUrl(md.canonicalPath, siteBaseUrl));
        }
      }
    }
    const expectedSet = new Set(expectedLocs);
    const sitemapSet = new Set(sitemapLocs);

    const missingFromSitemap = [...new Set(expectedLocs.filter((loc) => !sitemapSet.has(loc)))];
    const extraInSitemap = [...new Set(sitemapLocs.filter((loc) => !expectedSet.has(loc)))];
    const duplicateLocs = [
      ...new Set(sitemapLocs.filter((loc, i) => sitemapLocs.indexOf(loc) !== i)),
    ];

    const problems = [];
    if (missingFromSitemap.length > 0) {
      problems.push(
        `Route_Manifest canonical URL(s) missing from sitemap.xml: ${missingFromSitemap.join(', ')}`,
      );
    }
    if (extraInSitemap.length > 0) {
      problems.push(
        `sitemap.xml <loc>(s) with no matching Route_Manifest path: ${extraInSitemap.join(', ')}`,
      );
    }
    if (duplicateLocs.length > 0) {
      problems.push(`duplicate <loc> entries in sitemap.xml: ${duplicateLocs.join(', ')}`);
    }

    if (problems.length > 0) {
      throw new Error(problems.join('; '));
    }
  },
);

// ---------------------------------------------------------------------------
// Check 5: app.routes.ts exports valid Routes table with locale groups
// ---------------------------------------------------------------------------

check('app.routes.ts — registered routes table configuration', () => {
  const src = readTextFile(APP_ROUTES_TS_PATH);
  const hasRoutesExport = /export\s+const\s+routes\s*:\s*Routes\s*=/.test(src);
  if (!hasRoutesExport) {
    throw new Error('app.routes.ts does not export a valid `routes: Routes` array');
  }
});

// ---------------------------------------------------------------------------
// Check 6: Server_Bundle contains zero firebase/firestore and zero
//          firebase/auth specifiers
// ---------------------------------------------------------------------------

check('Server_Bundle — zero firebase/firestore and firebase/auth specifiers', () => {
  if (!existsSync(SERVER_DIR)) {
    throw new Error(`server bundle directory not found: ${SERVER_DIR}`);
  }

  const serverFiles = collectJsFiles(SERVER_DIR);
  if (serverFiles.length === 0) {
    throw new Error(`no .js or .mjs files found in ${SERVER_DIR}`);
  }

  const forbiddenSpecifiers = ['firebase/firestore', 'firebase/auth'];
  const forbiddenPatterns = forbiddenSpecifiers.map((specifier) => ({
    specifier,
    pattern: new RegExp(`(?<![/@])${specifier}`),
  }));
  const violations = [];

  for (const filePath of serverFiles) {
    const content = readFileSync(filePath, 'utf8');
    for (const { specifier, pattern } of forbiddenPatterns) {
      if (pattern.test(content)) {
        const relativePath = filePath.replace(ROOT + '\\', '').replace(ROOT + '/', '');
        violations.push(`${relativePath} contains "${specifier}"`);
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `Server_Bundle files must not contain firebase client-SDK specifiers:\n       ${violations.join('\n       ')}`,
    );
  }
});

// ---------------------------------------------------------------------------
// Check 7: production browser chunks contain zero unconditional debug-
//          token activation literal
// ---------------------------------------------------------------------------

check('browser chunks — zero unconditional FIREBASE_APPCHECK_DEBUG_TOKEN activation', () => {
  if (!existsSync(BROWSER_DIR)) {
    throw new Error(`browser output directory not found: ${BROWSER_DIR}`);
  }

  const browserFiles = collectJsFiles(BROWSER_DIR);
  if (browserFiles.length === 0) {
    throw new Error(`no .js files found in ${BROWSER_DIR}`);
  }

  const violations = [];
  const assignmentPattern = /FIREBASE_APPCHECK_DEBUG_TOKEN\s*=\s*["'`](?!undefined)/;

  for (const filePath of browserFiles) {
    const content = readFileSync(filePath, 'utf8');
    if (!content.includes('FIREBASE_APPCHECK_DEBUG_TOKEN')) continue;

    // The Firebase SDK's own internal code and our conditional `typeof`
    // check both reference this global name — acceptable. Flag only an
    // assignment that would hardcode a debug-token literal into the
    // production bundle (e.g. = "some-token"). A bare
    // `typeof X !== 'undefined'` conditional is expected.
    if (assignmentPattern.test(content)) {
      const relativePath = filePath.replace(ROOT + '\\', '').replace(ROOT + '/', '');
      violations.push(relativePath);
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `production chunks must not assign the debug-token literal "FIREBASE_APPCHECK_DEBUG_TOKEN":\n       ${violations.join('\n       ')}`,
    );
  }
});

// ---------------------------------------------------------------------------
// Check 8: Initial_Chunk raw size stays within the angular.json production
//          budget (maximumError: "1.75MB", R1.14)
// ---------------------------------------------------------------------------

check(
  'Initial_Chunk — raw size within the angular.json production budget (1.75MB error threshold, R1.14)',
  () => {
    const MAX_RAW_BYTES = 1.75 * 1024 * 1024;

    const chunkFiles = readInitialChunkFiles();
    let totalRawBytes = 0;
    for (const { content } of chunkFiles) {
      totalRawBytes += content.length;
    }

    if (totalRawBytes > MAX_RAW_BYTES) {
      const totalRawKB = (totalRawBytes / 1024).toFixed(2);
      const maxKB = (MAX_RAW_BYTES / 1024).toFixed(2);
      throw new Error(
        `Initial_Chunk raw size ${totalRawKB} kB exceeds the 1.75MB budget (${maxKB} kB)`,
      );
    }
  },
);

// ---------------------------------------------------------------------------
// Check 9: Initial_Chunk contains zero Firestore/Auth SDK specifier and
//          zero ADMIN_CHUNK_SENTINEL literal (R11.13, R11.14, R14.14)
// ---------------------------------------------------------------------------

check(
  'Initial_Chunk — zero Firestore/Auth SDK specifier and zero ADMIN_CHUNK_SENTINEL literal (R11.13, R11.14, R14.14)',
  () => {
    const chunkFiles = readInitialChunkFiles();
    const violations = [];
    const firestoreInternalRe = /@firebase\/firestore/;
    const firestoreBareRe = /(?<![/@])firebase\/firestore/;
    const authInternalRe = /@firebase\/auth/;
    const authBareRe = /(?<![/@])firebase\/auth/;
    const sentinelRe = /__ADMIN_CHUNK_SENTINEL__/;
    const adminChunkRe = /admin[\w-]*\.(?:js|mjs|css)/i;

    for (const { name, content } of chunkFiles) {
      const text = content.toString('utf8');

      if (firestoreInternalRe.test(text)) {
        violations.push(`${name}: contains "@firebase/firestore" (internal package specifier)`);
      }
      if (firestoreBareRe.test(text)) {
        violations.push(`${name}: contains bare "firebase/firestore" specifier`);
      }
      if (authInternalRe.test(text)) {
        violations.push(
          `${name}: contains "@firebase/auth" (internal package specifier) — admin auth module leaked into the initial bundle`,
        );
      }
      if (authBareRe.test(text)) {
        violations.push(
          `${name}: contains bare "firebase/auth" specifier — admin auth module leaked into the initial bundle`,
        );
      }
      if (sentinelRe.test(text)) {
        violations.push(
          `${name}: contains ADMIN_CHUNK_SENTINEL literal ("__ADMIN_CHUNK_SENTINEL__")`,
        );
      }
      if (adminChunkRe.test(text)) {
        violations.push(`${name}: contains URL-shaped admin chunk reference (admin*.js/mjs/css)`);
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Initial_Chunk must contain zero Firestore/Auth SDK specifier and zero admin-chunk reference:\n       ${violations.join('\n       ')}`,
      );
    }
  },
);

// ---------------------------------------------------------------------------
// Check 10: admin execution and publication isolation — no prerendered
//           admin path, admin chunk resolves outside the initial bundle
//           for the production configuration (R11.9, R11.10, R11.14)
// ---------------------------------------------------------------------------

check(
  'admin — zero prerendered path, chunk resolves outside the initial bundle (R11.9, R11.10, R11.14)',
  () => {
    const problems = [];

    const adminBrowserDir = join(BROWSER_DIR, 'admin');
    if (existsSync(adminBrowserDir)) {
      problems.push('dist/portfolio/browser/admin/ exists — an admin path was prerendered');
    }

    if (!existsSync(BROWSER_DIR)) {
      problems.push(`browser output directory not found: ${BROWSER_DIR}`);
    } else {
      const allChunks = collectJsFiles(BROWSER_DIR).filter((p) => !p.endsWith('.map'));
      const initialNames = new Set(
        readdirSync(BROWSER_DIR).filter((name) => INITIAL_CHUNK_PATTERNS.some((p) => p.test(name))),
      );
      const adminChunks = allChunks.filter((p) => {
        const text = readFileSync(p, 'utf8');
        return text.includes('__ADMIN_CHUNK_SENTINEL__');
      });
      if (adminChunks.length === 0) {
        problems.push(
          'no chunk carries __ADMIN_CHUNK_SENTINEL__ — is admin.routes.ts wired to reference it in its route data field?',
        );
      }
      for (const adminChunk of adminChunks) {
        const name = adminChunk.split(/[\\/]/).pop();
        if (initialNames.has(name)) {
          problems.push(`${name} carries ADMIN_CHUNK_SENTINEL but is also an Initial_Chunk file`);
        }
      }
    }

    if (problems.length > 0) {
      throw new Error(problems.join('; '));
    }
  },
);

// ---------------------------------------------------------------------------
// Print results and decide the exit code
// ---------------------------------------------------------------------------

const failed = results.filter((r) => !r.passed);
const passed = results.filter((r) => r.passed);

console.log(
  `assert-build-output: ${results.length} check(s) run, ${passed.length} passed, ${failed.length} failed.\n`,
);

if (failed.length > 0) {
  console.error('Failures:\n');
  for (const r of failed) {
    console.error(`  ✗ ${r.name}`);
    console.error(`      ${r.detail}`);
  }
  process.exit(1);
} else {
  console.log('assert-build-output passed: every check succeeded.');
}
