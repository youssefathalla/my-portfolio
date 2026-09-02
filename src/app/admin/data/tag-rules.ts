/**
 * Pure tag constraint logic for the Tag_Manager (admin-dashboard R13.7).
 *
 * All numeric bounds mirror the delivered Firestore Security_Rules:
 * - `newData.tags.size() <= 20`
 * - Each tag 1 to 32 characters
 * - No leading/trailing whitespace (trimmed on input)
 * - No duplicates (case-insensitive comparison)
 *
 * Rejection precedence is fixed: empty -> too-long -> duplicate -> limit-reached.
 */

export const TAG_CONSTRAINTS = { maxTags: 20, minLength: 1, maxLength: 32 } as const;

export type TagRejection = 'empty' | 'too-long' | 'duplicate' | 'limit-reached';

/**
 * Attempts to add a candidate tag to an existing tag array.
 *
 * The candidate is trimmed before any validation. Rejection follows a fixed
 * precedence so that the announced reason is deterministic:
 * 1. `empty` — trimmed length < minLength
 * 2. `too-long` — trimmed length > maxLength
 * 3. `duplicate` — case-insensitive match already exists
 * 4. `limit-reached` — existing array is at or above maxTags
 *
 * On success, returns a new array with the trimmed candidate appended.
 */
export function addTag(
  existing: readonly string[],
  candidate: string,
): { readonly ok: true; readonly tags: readonly string[] } | { readonly ok: false; readonly reason: TagRejection } {
  const tag = candidate.trim();

  if (tag.length < TAG_CONSTRAINTS.minLength) {
    return { ok: false, reason: 'empty' };
  }

  if (tag.length > TAG_CONSTRAINTS.maxLength) {
    return { ok: false, reason: 'too-long' };
  }

  const lower = tag.toLowerCase();
  if (existing.some((t) => t.toLowerCase() === lower)) {
    return { ok: false, reason: 'duplicate' };
  }

  if (existing.length >= TAG_CONSTRAINTS.maxTags) {
    return { ok: false, reason: 'limit-reached' };
  }

  return { ok: true, tags: [...existing, tag] };
}

/**
 * Removes all case-insensitive matches of `tag` from the existing array.
 *
 * Returns the original array by reference if no match is found, so callers
 * can use referential equality to detect a no-op.
 */
export function removeTag(existing: readonly string[], tag: string): readonly string[] {
  const lower = tag.toLowerCase();
  const filtered = existing.filter((t) => t.toLowerCase() !== lower);
  return filtered.length === existing.length ? existing : filtered;
}
