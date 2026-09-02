/**
 * Route manifest integrity guards.
 * Validates unique paths, required fields, and SEO title/description character limits.
 */

import { DEFAULT_LOCALE, LOCALES } from '../../src/app/core/i18n/locale';
import type { Locale } from '../../src/app/core/i18n/locale';
import type { RouteManifestEntry } from '../../src/app/core/routing/route-manifest';

/** A single field-level validation failure on one manifest entry. */
export interface ManifestFieldError {
  /** The offending entry's `key`. */
  readonly key: string;
  /** The offending field name (dot-path for nested `metadata` fields). */
  readonly field: string;
  /** Human-readable description of the violated bound. */
  readonly reason: string;
}

/** Route metadata title and description character bounds. */
const TITLE_MIN = 30;
const TITLE_MAX = 60;
const DESCRIPTION_MIN = 120;
const DESCRIPTION_MAX = 160;

/** Reports duplicate path declarations within the route manifest. */
export function findDuplicatePaths(manifest: readonly RouteManifestEntry[]): readonly string[] {
  const counts = new Map<string, number>();
  for (const entry of manifest) {
    counts.set(entry.path, (counts.get(entry.path) ?? 0) + 1);
  }
  const duplicates: string[] = [];
  for (const [path, count] of counts) {
    if (count > 1) {
      duplicates.push(path);
    }
  }
  return duplicates;
}

/** Reports missing or malformed fields on manifest entries. */
export function findInvalidManifestEntries(
  manifest: readonly RouteManifestEntry[],
  _locales: readonly Locale[] = LOCALES,
): readonly ManifestFieldError[] {
  const errors: ManifestFieldError[] = [];

  for (const entry of manifest) {
    const key = entry.key;

    if (typeof entry.path !== 'string') {
      errors.push({ key, field: 'path', reason: 'path is missing or empty' });
    }

    if (!entry.metadata) {
      errors.push({ key, field: 'metadata', reason: 'metadata is missing' });
    }
  }

  return errors;
}

/**
 * Validates metadata constraints per locale:
 * length bounds, duplicate prevention, and cross-locale differentiation.
 */
interface ValueCounts {
  readonly titleCounts: Map<string, number>;
  readonly descriptionCounts: Map<string, number>;
}

function countMetadataValues(manifest: readonly RouteManifestEntry[], locale: Locale): ValueCounts {
  const titleCounts = new Map<string, number>();
  const descriptionCounts = new Map<string, number>();

  for (const entry of manifest) {
    const meta = entry.metadata?.[locale];
    if (meta) {
      if (typeof meta.title === 'string') {
        titleCounts.set(meta.title, (titleCounts.get(meta.title) ?? 0) + 1);
      }
      if (typeof meta.description === 'string') {
        descriptionCounts.set(meta.description, (descriptionCounts.get(meta.description) ?? 0) + 1);
      }
    }
  }

  return { titleCounts, descriptionCounts };
}

function validateLengthBounds(
  key: string,
  locale: Locale,
  title: unknown,
  description: unknown,
): ManifestFieldError[] {
  const errors: ManifestFieldError[] = [];

  const titleLen = typeof title === 'string' ? title.length : 0;
  if (typeof title !== 'string' || titleLen < TITLE_MIN || titleLen > TITLE_MAX) {
    errors.push({
      key,
      field: `metadata.${locale}.title`,
      reason: `title length ${titleLen} is outside the 30-60 character bound`,
    });
  }

  const descLen = typeof description === 'string' ? description.length : 0;
  if (typeof description !== 'string' || descLen < DESCRIPTION_MIN || descLen > DESCRIPTION_MAX) {
    errors.push({
      key,
      field: `metadata.${locale}.description`,
      reason: `description length ${descLen} is outside the 120-160 character bound`,
    });
  }

  return errors;
}

function validateDuplicateValues(
  key: string,
  locale: Locale,
  title: unknown,
  description: unknown,
  counts: ValueCounts,
): ManifestFieldError[] {
  const errors: ManifestFieldError[] = [];

  if (typeof title === 'string' && (counts.titleCounts.get(title) ?? 0) > 1) {
    errors.push({
      key,
      field: `metadata.${locale}.title`,
      reason: `title is duplicated across entries within locale '${locale}'`,
    });
  }

  if (typeof description === 'string' && (counts.descriptionCounts.get(description) ?? 0) > 1) {
    errors.push({
      key,
      field: `metadata.${locale}.description`,
      reason: `description is duplicated across entries within locale '${locale}'`,
    });
  }

  return errors;
}

function validateTranslationEquality(
  entry: RouteManifestEntry,
  locale: Locale,
  defaultLocale: Locale,
): ManifestFieldError[] {
  if (locale === defaultLocale) {
    return [];
  }

  const defaultMeta = entry.metadata?.[defaultLocale];
  const meta = entry.metadata?.[locale];
  if (!defaultMeta || !meta) {
    return [];
  }

  const errors: ManifestFieldError[] = [];
  if (typeof meta.title === 'string' && meta.title === defaultMeta.title) {
    errors.push({
      key: entry.key,
      field: `metadata.${locale}.title`,
      reason: `title is identical to the default locale '${defaultLocale}' value`,
    });
  }
  if (typeof meta.description === 'string' && meta.description === defaultMeta.description) {
    errors.push({
      key: entry.key,
      field: `metadata.${locale}.description`,
      reason: `description is identical to the default locale '${defaultLocale}' value`,
    });
  }

  return errors;
}

function validateManifestEntry(
  entry: RouteManifestEntry,
  locale: Locale,
  defaultLocale: Locale,
  counts: ValueCounts,
): ManifestFieldError[] {
  const meta = entry.metadata?.[locale];
  if (!meta) {
    return [{ key: entry.key, field: `metadata.${locale}`, reason: 'metadata is missing' }];
  }

  return [
    ...validateLengthBounds(entry.key, locale, meta.title, meta.description),
    ...validateDuplicateValues(entry.key, locale, meta.title, meta.description, counts),
    ...validateTranslationEquality(entry, locale, defaultLocale),
  ];
}

export function findMetadataBoundViolations(
  manifest: readonly RouteManifestEntry[],
  locales: readonly Locale[] = LOCALES,
  defaultLocale: Locale = DEFAULT_LOCALE,
): readonly ManifestFieldError[] {
  const errors: ManifestFieldError[] = [];

  for (const locale of locales) {
    const counts = countMetadataValues(manifest, locale);
    for (const entry of manifest) {
      errors.push(...validateManifestEntry(entry, locale, defaultLocale, counts));
    }
  }

  return errors;
}
