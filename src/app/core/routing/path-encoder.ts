/** Path encoding and decoding utilities for localized route segments. */
import { DEFAULT_LOCALE, LOCALES } from '../i18n/locale';
import type { Locale } from '../i18n/locale';

/** Prepends the locale prefix if non-default (e.g. 'ar/services'). Returns unmodified for default locale. */
export function toLocalizedPath(path: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) {
    return path;
  }
  return path === '' ? locale : `${locale}/${path}`;
}

/** Extracts the locale and bare manifest path from a localized path string. */
export function toManifestPath(localizedPath: string): { readonly locale: Locale; readonly path: string } {
  const [first, ...rest] = localizedPath.split('/');
  const nonDefaultLocale = LOCALES.find((l) => l !== DEFAULT_LOCALE && l === first);
  if (nonDefaultLocale) {
    return { locale: nonDefaultLocale, path: rest.join('/') };
  }
  return { locale: DEFAULT_LOCALE, path: localizedPath };
}
