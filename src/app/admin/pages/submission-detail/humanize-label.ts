/**
 * Converts a camelCase, snake_case, or kebab-case key into a human-readable label.
 *
 * - Splits camelCase at uppercase boundaries
 * - Replaces all `_` and `-` separators with spaces
 * - Trims and collapses internal whitespace
 * - Produces sentence case (first character uppercase, rest lowercase)
 * - Is idempotent: `toHumanLabel(toHumanLabel(x)) === toHumanLabel(x)`
 * - Output contains zero `_` and zero `-`
 */
export function toHumanLabel(key: string): string {
  const result = key
    // Insert a space before each uppercase letter that follows a lowercase letter or digit
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    // Insert a space between consecutive uppercase letters followed by a lowercase letter (e.g., HTMLParser → HTML Parser)
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    // Replace underscore and hyphen separators with spaces
    .replace(/[_-]+/g, ' ')
    // Trim leading/trailing whitespace
    .trim()
    // Collapse multiple spaces into one
    .replace(/\s+/g, ' ')
    // Lowercase everything
    .toLowerCase();

  if (result.length === 0) return '';

  // Capitalize only the first character (sentence case)
  return result.charAt(0).toUpperCase() + result.slice(1);
}
