/**
 * Bulk action reconciliation (admin-dashboard R9.6).
 *
 * Pure accounting over per-item settled results from a `Promise.allSettled` call.
 * The conservation law holds for any input: `succeededIds.length + failedIds.length
 * === selectedIds.length`, the two sets are disjoint, and their union is exactly
 * `selectedIds`. Missing results (shorter array) fall to `failedIds` — the safe
 * direction, since a wrongly-failed item stays selected and gets retried.
 */

/** The accounting a partially-failed Bulk_Action produces (R9.6). */
export interface BulkOutcome {
  readonly succeededIds: readonly string[];
  readonly failedIds: readonly string[];
}

/**
 * Maps each selected id to succeeded or failed based on its positionally-
 * corresponding `PromiseSettledResult`. Extra results beyond `selectedIds.length`
 * are ignored; missing results default to failed.
 */
export function reconcileBulkResult(
  selectedIds: readonly string[],
  results: readonly PromiseSettledResult<unknown>[],
): BulkOutcome {
  const succeededIds: string[] = [];
  const failedIds: string[] = [];

  for (let i = 0; i < selectedIds.length; i++) {
    if (results[i]?.status === 'fulfilled') {
      succeededIds.push(selectedIds[i]);
    } else {
      failedIds.push(selectedIds[i]);
    }
  }

  return { succeededIds, failedIds };
}
