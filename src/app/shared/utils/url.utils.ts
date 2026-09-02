/**
 * Classifies a string as a configured, secure HTTPS URL.
 *
 * Returns true only when value is non-empty, at most 2048 characters,
 * and parses as an absolute URL with https:// scheme.
 */
export function isConfiguredUrl(value: string | undefined | null): boolean {
  if (value == null || value.trim().length === 0 || value.length > 2048) {
    return false;
  }

  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}
