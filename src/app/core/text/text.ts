/** Returns true if value is nullish, empty, or whitespace-only. */
export function isBlank(value: string | null | undefined): boolean {
  return value == null || value.trim().length === 0;
}
