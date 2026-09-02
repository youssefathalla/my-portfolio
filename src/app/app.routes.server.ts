/**
 * The Server_Route_Table (R2.13, R3.16, R3.17, R3.18) — the `ServerRoute[]`
 * `app.config.server.ts` feeds to `provideServerRendering(withRoutes(...))`.
 *
 * Server-route matching is first-match-wins, most specific first, so the
 * three Excluded_Route entries (`admin`, `admin/**`, `playground`) MUST
 * precede the trailing `'**'` catch-all — otherwise the catch-all would
 * claim them first and they'd prerender instead of rendering client-side.
 *
 * The trailing `'**'` entry covers every other path the Route_Table
 * (`app.routes.ts`) resolves to a component: both Locale_Route_Groups'
 * ten Route_Manifest children plus their own `'**'` (`ManifestNotFound`),
 * and the top-level `'**'` (also `ManifestNotFound`). All of those
 * prerender eagerly per R2.13/R2.14.
 *
 * Zero entry here names a path the Route_Table resolves to no component
 * (R3.18) — `admin`, `admin/**`, and `playground` all match real routes
 * in `app.routes.ts`, and `'**'` matches everything else that table
 * defines.
 *
 * Requirements: R2.13, R3.16, R3.17, R3.18
 */
import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: 'playground', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
