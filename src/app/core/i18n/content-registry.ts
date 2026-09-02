import { LOCALES } from './locale';

/**
 * Pure, total (R2.6): reports whether `value`'s own enumerable key set
 * equals the Locale_Set exactly. Returns `false`, never throws, for
 * null, undefined, arrays, and every non-object value.
 */
export function isCompleteLocaleRecord(value: unknown): boolean {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length === LOCALES.length && LOCALES.every((locale) => keys.includes(locale));
}
