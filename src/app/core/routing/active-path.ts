/**
 * Normalises `Router.url` (which may carry a leading `/` and a trailing
 * query string or fragment) to the bare `ROUTE_MANIFEST` path format: no
 * leading `/`, no trailing `/`, no `?query` or `#fragment` suffix.
 *
 * Extracted as a shared utility so every consumer that needs to resolve
 * the currently-active `ROUTE_MANIFEST` path from `Router.url` (e.g.
 * `SiteNav` for Nav_Target resolution, `RealAnalyticsAdapter` for
 * attaching the active route to every forwarded event) applies the exact
 * same normalisation rule rather than reimplementing it.
 */
export function normalizeActivePath(url: string): string {
  // Remove query string or fragment
  const path = url.split(/[?#]/, 1)[0];

  // Trim leading and trailing slashes in O(N) without regex backtracking
  let start = 0;
  let end = path.length;

  while (start < end && path.codePointAt(start) === 47 /* '/' */) {
    start++;
  }
  while (end > start && path.codePointAt(end - 1) === 47 /* '/' */) {
    end--;
  }

  return path.slice(start, end);
}
