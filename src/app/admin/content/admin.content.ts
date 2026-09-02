/**
 * Admin dashboard content (admin-dashboard R14.6).
 *
 * Every admin-specific UI string lives in this module, physically inside
 * `src/app/admin/` — never `src/app/content/`. That physical separation is
 * what makes Check 17's chunk-isolation assertion structural: no public module
 * can reach this file through an import, so admin strings are absent from
 * public chunks by construction rather than by tree-shaking hope.
 *
 * The module exports a single frozen `as const` object. Components read from
 * it; nothing writes to it; and property-based testing has nothing to quantify
 * over a frozen data literal, so no `*.property.spec.ts` accompanies it.
 */

import type { AdminIconName } from '../shared/admin-icon';

/**
 * Navigation entry rendered in the Admin_Shell sidebar (R5.1).
 */
export interface AdminNavEntry {
  readonly label: string;
  readonly path: string;
  readonly icon: AdminIconName;
}

/**
 * All admin-specific UI strings, exported as a single frozen constant.
 *
 * Consumed by:
 * - `LoginPage` — `loginTitle` via `SeoService.initExcludedRoute` (R3.6)
 * - `AdminShell` — `nav` for sidebar links (R5.1)
 * - `OverviewPage` — `overviewTitle` and `overviewEmpty` (R6.2)
 * - `SubmissionsListPage` — `submissionsListTitle` (R8)
 * - `SubmissionDetailPage` — `submissionDetailTitle` (R11)
 * - `SubmissionDetailPage` — `statusConfirm` for the confirmation dialog (R12.3)
 */
export const ADMIN_CONTENT = {
  // ---------------------------------------------------------------------------
  // Navigation labels (R5.1)
  // ---------------------------------------------------------------------------

  nav: [
    { label: 'Overview', path: '/admin', icon: 'dashboard' },
    { label: 'Submissions', path: '/admin/submissions', icon: 'inbox' },
  ] as const satisfies readonly AdminNavEntry[],

  // ---------------------------------------------------------------------------
  // Page titles — passed to SeoService.initExcludedRoute (R3.6)
  // ---------------------------------------------------------------------------

  loginTitle: 'Admin Login',
  shellTitle: 'Admin Dashboard',
  overviewTitle: 'Overview — Admin',
  submissionsListTitle: 'Submissions — Admin',
  submissionDetailTitle: 'Submission Detail — Admin',

  // ---------------------------------------------------------------------------
  // Status workflow confirmation messages (R12.3)
  // ---------------------------------------------------------------------------

  statusConfirm: {
    spam: 'Mark as spam?',
    archived: 'Archive this submission?',
  },

  // ---------------------------------------------------------------------------
  // Overview empty state (R6.2)
  // ---------------------------------------------------------------------------

  overviewEmpty: 'No submissions yet',
} as const;
