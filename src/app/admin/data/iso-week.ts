/**
 * Returns the UTC midnight epoch millisecond value of the Monday that begins
 * the ISO week containing the given instant.
 *
 * ISO weeks start on Monday. `Date.prototype.getUTCDay()` returns 0 for Sunday,
 * so a naive `date - day * 86_400_000` is off by a full week every Sunday.
 * The `(day + 6) % 7` transform maps Monday -> 0 ... Sunday -> 6, which is the
 * correct ISO day-of-week offset.
 *
 * @param epochMs - Any epoch millisecond value.
 * @returns The epoch millisecond value of 00:00:00.000 UTC on the Monday
 *          beginning the ISO week that contains `epochMs`.
 */
export function startOfIsoWeek(epochMs: number): number {
  const d = new Date(epochMs);
  const isoDayIndex = (d.getUTCDay() + 6) % 7; // Mon -> 0, Tue -> 1, ..., Sun -> 6
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - isoDayIndex);
}
