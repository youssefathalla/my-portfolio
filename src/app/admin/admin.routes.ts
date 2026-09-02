/**
 * Admin_Route_Group (R11.5, R11.6, R11.13).
 *
 * One lazily-loaded route group at `/admin`, reached by the single
 * `loadChildren` entry in `app.routes.ts`. Deliberately NOT a
 * ROUTE_MANIFEST entry — excluded from the Global_Nav, the Breadcrumb_Trail,
 * and `sitemap.xml` by construction (R11.10, R11.11).
 *
 * The `ADMIN_CHUNK_SENTINEL` constant is retained in the route `data` field
 * (R11.13, R14.14) — a bare import of a string constant is tree-shaken
 * away, but a value held in an emitted route-configuration object literal
 * is not. This is what arms Check 14 in `scripts/assert-build-output.mjs`:
 * if this module ever lands in the initial chunk, the literal lands with it
 * and the build fails.
 *
 * PROVIDER SCOPE (R11.5): the `providers` array sits on a pathless parent
 * route that wraps BOTH the login route and the shell route.
 * `loginRedirectGuard` injects `AuthService`, so `AuthService` must be
 * resolvable from the login route as well — a `providers` array on the
 * shell route alone leaves the sibling login route without it (NG0201).
 * One array, one level up, covers both. Zero admin service is registered
 * at the application root (R11.6) — see `app.config.ts`.
 *
 * NOTE: `./auth/auth.guard`, `./auth/auth.service`, `./data/overview-counts.service`,
 * `./data/submission-mutations.service`, `./data/submissions-query.service`, and
 * `./export/export.service` are ported by Tasks 6.2–6.4 and do not exist on disk
 * yet as of this task. `./pages/*` are ported by Task 6.5.
 */

import { Routes } from '@angular/router';

export const ADMIN_CHUNK_SENTINEL = '__ADMIN_CHUNK_SENTINEL__';

import { authGuard, loginRedirectGuard } from './auth/auth.guard';
import { AuthService } from './auth/auth.service';
import { OverviewCountsService } from './data/overview-counts.service';
import { SubmissionMutationsService } from './data/submission-mutations.service';
import { SubmissionsQueryService } from './data/submissions-query.service';
import { ExportService } from './export/export.service';

export const ADMIN_ROUTES: Routes = [
  {
    // Pathless provider scope — consumes zero URL segment, establishes the
    // environment injector shared by the login route and the shell route (R11.5).
    path: '',
    providers: [
      AuthService,
      SubmissionsQueryService,
      SubmissionMutationsService,
      OverviewCountsService,
      ExportService,
    ],
    data: { chunk: ADMIN_CHUNK_SENTINEL }, // R11.13, R14.14 — retained in route object, not tree-shakeable
    children: [
      {
        // R11.8 — the login page: no authGuard, only the inverse redirect guard.
        path: 'login',
        canActivate: [loginRedirectGuard],
        loadComponent: () => import('./pages/login/login-page').then((m) => m.LoginPage),
      },
      {
        // R11.7 — every other admin page, inside the admin shell, behind authGuard.
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/shell/admin-shell').then((m) => m.AdminShell),
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./pages/overview/overview-page').then((m) => m.OverviewPage),
          },
          {
            path: 'submissions',
            loadComponent: () =>
              import('./pages/submissions-list/submissions-list-page').then(
                (m) => m.SubmissionsListPage,
              ),
          },
          {
            // R11.1 — the detail page, reached by document ID.
            path: 'submissions/:id',
            loadComponent: () =>
              import('./pages/submission-detail/submission-detail-page').then(
                (m) => m.SubmissionDetailPage,
              ),
          },
          { path: '**', redirectTo: '', pathMatch: 'full' },
        ],
      },
    ],
  },
];
