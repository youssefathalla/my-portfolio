# Implementation Plan: Portfolio Merge

## Overview

Eight Merge Phases, executed strictly in the order design.md fixes: Configuration-and-SSR, Submission-schema, Firebase-and-functions, Core-services, Locale-routing-and-SEO, Admin, Quality-tooling, Documentation. Per R16.1/R16.12, each phase's Verification_Gate (`npm run build && npm test && npm run lint`, plus the phase-specific check design.md names) must pass before the next phase begins, and a phase that fails is fixed inside that phase — never deferred. Every sub-task below implements a decision the Decision Register already closed; no task re-derives a decision.

Language: TypeScript (Angular v22, zoneless, signal-first), per AGENTS.md.

## Tasks

- [x] 1. Configuration-and-SSR
  - [x] 1.1 Merge `package.json` scripts, dependencies, and devDependencies
    - Union the Base_Workspace script set with the four retained Source_Workspace scripts (`prebuild`, `assert-build`, `assert-no-any`, `test:emulator`); collapse the five byte-identical name collisions (`ng`, `start`, `build`, `watch`, `test`) to one entry each; retain `packageManager: npm@11.17.0`
    - Add `@angular/ssr`, `@angular/platform-server`, `firebase`, `papaparse` as dependencies and `fast-check`, `tsx`, `@types/node`, `@types/papaparse` as devDependencies; retain `"type": "module"`
    - _Requirements: R1.5, R1.6, R1.7, R1.8, R1.9_
  - [x] 1.2 Update `angular.json` build and test targets
    - Add `server: "src/main.server.ts"`, `ssr.entry: "src/server.ts"`, `outputMode: "server"`; set the `initial` bundle budget to `maximumWarning: "1.5MB"` / `maximumError: "1.75MB"`
    - Retain `stylePreprocessorOptions.includePaths: ["src/styles"]` and the global styles list `["src/tailwind.css", "src/styles.scss"]` unchanged; add zero Source_Workspace style entry
    - Retain the test target's `providersFile: "src/test-providers.ts"` and `watch: false` unchanged
    - _Requirements: R1.10, R1.11, R1.12, R1.14, R2.3_
  - [x] 1.3 Verify `tsconfig.json` strictness settings are retained
    - Confirm `strict`, `noImplicitAny`, `forceConsistentCasingInFileNames`, `noPropertyAccessFromIndexSignature`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `isolatedModules`, `strictTemplates`, `strictInjectionParameters` are all declared
    - _Requirements: R1.13_
  - [x] 1.4 Reconcile the environment constant into `src/environments/`
    - Create `src/environments/environment.model.ts` (`AppEnvironment` with `production: boolean` added and `baseUrl` replacing `siteBaseUrl`; `FirebaseConfig`), `environment.ts` (dev values, `baseUrl: 'http://localhost:4200'`), `environment.prod.ts` (`baseUrl: 'https://youssefathalla.com'`)
    - Create `src/app/core/config/url.ts` exporting the pure predicate `isConfiguredUrl`; delete `src/app/core/config/environment.ts`
    - _Requirements: R1.15, R9.19_
  - [x] 1.5 Add SSR entry points and the `/api/` bail
    - Create `src/main.server.ts`, `src/app/app.config.server.ts`, `src/app/app.routes.server.ts` (empty `ServerRoute[]` for now — populated in Phase 5), and `src/server.ts`
    - Port `src/server.ts`'s catch-all with the `req.path.startsWith('/api/')` bail (`return next()`) ahead of `angularApp.handle(req)`, and change its port read from `process.env['PORT']` to `process.env['SSR_PORT'] || 4000`; leave `server/server.js` reading `PORT` with default 3000 unchanged
    - _Requirements: R2.1, R2.2, R2.4, R2.5, R2.6, R2.7, R2.9, R2.10, R2.11, R2.12_
  - [x]* 1.6 Write unit tests for `isConfiguredUrl` and the environment split
    - Cover the non-blank / ≤2048-character / `https`-scheme classification boundary and the `baseUrl` dev-vs-prod value split
    - _Requirements: R9.19, R1.15_
  - [x] 1.7 Checkpoint — Phase 1 Verification_Gate
    - Run `npm run build` for both `development` and `production` configurations, `npm test`, and `npm run lint`, all exiting 0. Ensure all tests pass, ask the user if questions arise.
    - _Requirements: R1.1, R1.2, R1.3, R1.4, R16.2_

- [x] 2. Submission-schema
  - [x] 2.1 Create the single copy of the Submission_Schema_Module
    - Add `shared/submission-schema/index.ts`, `submission.ts`, `classify-submission-type.ts` at the repository root, importing only from relative paths inside that directory, with zero `@angular/*`, `firebase-functions`, `firebase-admin`, `firebase/*`, DOM, or Node type
    - _Requirements: R8.5, R8.6_
  - [x] 2.2 Declare the `@submission-schema/*` Path_Alias_Map alias
    - Add `@submission-schema/*` → `./shared/submission-schema/*` (one target) to the root `tsconfig.json`; add `"shared/submission-schema/**/*.ts"` to `tsconfig.app.json` and `tsconfig.spec.json` `include`
    - _Requirements: R8.1, R8.2, R8.3, R8.11, R8.12_
  - [x] 2.3 Rewrite `functions/tsconfig.json` and `functions/package.json`
    - Change `rootDir` from `"./src"` to `".."`, `paths` from `@shared/*` to `@submission-schema/*` → `["../shared/submission-schema/*"]`, add `"../shared/submission-schema/**/*.ts"` to `include` and its spec files to `exclude`
    - Change `functions/package.json` `main` from `"lib/index.js"` to `"lib/functions/src/index.js"`
    - _Requirements: R8.7, R8.8, R8.9, R8.10_
  - [x] 2.4 Rewrite the six `@shared/submission-schema/` import specifiers
    - Update `admin/data/submission-record.ts`, `admin/data/submissions-query.service.ts`, `admin/export/export.service.ts` (dynamic import), and the three specifiers in `core/contact/firestore-submission-sink.ts` to `@submission-schema/submission`
    - _Requirements: R8.4_
  - [x]* 2.5 Write property tests for the Submission_Schema_Module in `shared/submission-schema/submission.spec.ts`
    - **Property 3: Submission document Firestore round trip** — Validates: Requirements R12.7, R12.12
    - **Property 6: `isValidSubmissionDocument` rejects malformed documents** — Validates: Requirements R12.10
    - **Property 7: `isValidPayloadForType` rejects payloads violating their type's shape** — Validates: Requirements R12.11
    - _Requirements: R12.7, R12.10, R12.11, R12.12_
  - [x] 2.6 Checkpoint — Phase 2 Verification_Gate
    - `npm run build && npm test && npm run lint`; additionally `npm run build` inside `functions/` exits 0 under TypeScript 5.8.x/`Node16`, and the app-level build exits 0 under TypeScript 6.0.x/`preserve`, both compiling every Submission_Schema_Module file with identical strictness. Ensure all tests pass, ask the user if questions arise.
    - _Requirements: R8.8, R8.9, R8.10, R8.13, R8.14, R16.3_

- [x] 3. Firebase-and-functions
  - [x] 3.1 Port the Deployment_Config_Set to the repository root
    - Add `firebase.json` (Emulator_Suite ports auth 9199, firestore 8180, functions 5001, UI 4100, `singleProjectMode: true`), `.firebaserc`, `firestore.rules`, `firestore.indexes.json`
    - _Requirements: R9.2, R10.9, R10.10_
  - [x] 3.2 Apply the App Check diff to `firestore.rules`
    - Change the `submissions/{submissionId}` create rule from `allow create: if true` to `allow create: if request.app.appId != null`, and replace the comment above it with the corrected version recorded in the Decision Register (App Check _enforcement_ is a Firebase console setting, not something this rule configures)
    - _Requirements: R9.17 (App Check enforcement decision, R9 Decision Register)_
  - [x] 3.3 Fix the duplicate-field-path bug in the index generator
    - In `admin/data/query-plan.ts`'s `enumerateRequiredIndexes()`, change the inner loop guard from `if (isDegenerate(subset, sortField)) continue;` to `if (isDegenerate(subset, sortField) || subset.includes(sortField as ConstraintField)) continue;`, removing the three duplicate-field-path index definitions (`type ASC, status ASC, status ASC` and its two `tags`-bearing variants) from both the generator's output and `firestore.indexes.json`
    - _Requirements: R10.12 (Malformed Firestore composite index deploy failure, Error Handling)_
  - [x]* 3.4 Add the App-Check-rejection rules-suite test case
    - In `functions/src/rules-suite.spec.ts`, add a new case submitting an otherwise `isValidCreate`-satisfying document (server-stamped `createdAt`/`updatedAt`, exactly the required key set) through a context carrying no App Check token, asserting `assertFails` specifically because `request.app.appId` is `null` — the one branch the existing `'should deny unauthenticated writes without App Check'` test does not exercise
    - _Requirements: R9.17 (Verification gap, R9 Decision Register), R10.11_
  - [x] 3.5 Port the Cloud_Functions_Project
    - Add `functions/src/index.ts` (exporting exactly `onSubmissionCreated` and `onCalcomWebhook`), `notification-function.ts`, `webhook-function.ts`, `rate-limit.ts`, `spam-heuristic.ts`, `booking-event.ts`, plus `functions/scripts/set-admin-claim.mjs`, `functions/SECRETS.md`, `functions/package.json` (with the Phase 2 `main` field change), `functions/tsconfig.json` (with the Phase 2 rewrite)
    - Exclude every `*.spec.ts` file from the Cloud_Functions_Project emit set
    - _Requirements: R10.1, R10.2, R10.3, R10.4, R10.5, R10.6, R10.13, R10.14, R10.15_
  - [x] 3.6 Verify zero Firebase Admin/Functions leakage into the app
    - Confirm the root `package.json` declares zero dependency on `firebase-admin`/`firebase-functions`, and zero file under `src/` imports a `firebase-admin/*` or `firebase-functions/*` module
    - _Requirements: R10.7, R10.8_
  - [x] 3.7 Checkpoint — Phase 3 Verification_Gate
    - `npm run build && npm test && npm run lint`, closed by `npm run test:emulator` exiting 0 (starts the Emulator_Suite, runs `functions/src/rules-suite.spec.ts` including the new App-Check case). Ensure all tests pass, ask the user if questions arise.
    - _Requirements: R16.4_

- [x] 4. Core-services
  - [x] 4.1 Create `core/platform/platform.ts`
    - Export `isBrowser()` unchanged from the Source_Workspace
    - _Requirements: R2.15, R9.12_
  - [x] 4.2 Create `core/analytics/`
    - Add `analytics.ts` (abstract `AnalyticsAdapter`) and `real-analytics-adapter.ts` with its specification
    - _Requirements: R9.8_
  - [x] 4.3 Create `core/firebase/`
    - Add `firebase-app.service.ts` (ported unchanged, `handles()` resolving `null` on the four documented conditions) and `firestore-outcome-map.ts` with its specification, declaring `FirestoreOutcomeCode` as an eight-member union (the inverted edge that severs the `core → admin` dependency)
    - _Requirements: R9.3, R9.11, R9.12, R9.13, R9.14, R6.6 (edge 2 decision)_
  - [x] 4.4 Create `core/contact/`
    - Add `submission-sink.ts` (abstract `SubmissionSink`, now declaring `SubmitOutcome` itself), `firestore-submission-sink.ts`, `formspree-submission-sink.ts`
    - _Requirements: R9.3, R9.4, R9.17, R9.18, R6.6 (edge 1 decision)_
  - [x] 4.5 Wire the Sink_Flag and Analytics_Flag provider swap points
    - In `app.config.ts`, register `SubmissionSink` resolving to `FirestoreSubmissionSink` when `environment.sinkFlag` is `true` and `FormspreeSubmissionSink` when `false`; register `AnalyticsAdapter` resolving to `RealAnalyticsAdapter` when `environment.analyticsEnabled` is `true` and the no-op adapter when `false`; require zero component-source edit when either flag changes
    - _Requirements: R9.5, R9.6, R9.7, R9.9, R9.10_
  - [x]* 4.6 Write unit tests for the Firebase-handle-resolves-to-`null` matrix
    - Cover the four conditions: non-browser context, blank required config field, blank `appCheckSiteKey`, initialization exceeding 10 seconds
    - _Requirements: R9.12, R9.13, R9.14_
  - [x]* 4.7 Write unit tests for Firestore write failure mapping and the Formspree fallback outcomes
    - Cover `mapFirestoreErrorToOutcome` / `mapFirestoreErrorToAdminError` branches and the Formspree unconfigured-endpoint, timeout, network-failure, and non-2xx branches, asserting the caller never sees a raw Firebase error message
    - _Requirements: R9.18, R9.20_
  - [x] 4.8 Checkpoint — Phase 4 Verification_Gate
    - `npm run build && npm test && npm run lint`. Ensure all tests pass, ask the user if questions arise.
    - _Requirements: R16.5_

- [x] 5. Locale-routing-and-SEO
  - [x] 5.1 Create `core/i18n/locale.ts`
    - Declare `Locale`, `LOCALES`, `DEFAULT_LOCALE`, `Direction`, `LocalizedText`, `directionFor`, and the `LOCALE` `InjectionToken<Locale>` with no default value; import zero `@angular/router`, zero Route_Manifest, zero Content_Module
    - _Requirements: R4.2, R7.8_
  - [x] 5.2 Create `core/routing/route-manifest.ts` and relocate `route-manifest.content.ts`
    - Declare `RouteMetadata`, `RouteManifestEntry`, `NavPlacement` in `route-manifest.ts`; relocate `route-manifest.content.ts` to `src/app/core/routing/`, preserving all 10 `NAV_LABEL_*` and 10 `*_METADATA` constants byte-for-byte in both Locale branches
    - Declare the full 10-entry `ROUTE_MANIFEST` (`landing`, `services-hub`, `turnkey`, `augmentation`, `sprints`, `audits`, `policies`, `workflow`, `case-studies`, `contact`), each with `path`, `navLabel`, `navPlacement`, `metadata` identical to the Source_Workspace, and zero entry keyed or pathed `admin`/`admin/*`
    - _Requirements: R3.1, R3.5, R3.6, R3.7, R3.13, R6.2, R6.8, R6.9, R6.10, R6.11, R7.7_
  - [x] 5.3 Create the remaining `core/routing/` and `core/i18n/` support modules
    - Add `path-encoder.ts` (`toLocalizedPath`/`toManifestPath`, re-exported from `route-manifest.ts`, importing zero Content_Module), `active-path.ts`, `document-locale.service.ts`, `scroll-restoration.service.ts`
    - Relocate `content-registry.ts` and `content-registry.spec.ts` to `core/i18n/`
    - _Requirements: R6.2, R6.14, R12.1, R12.2, R12.5, R12.6_
  - [x] 5.4 Create `core/text/text.ts` reduced to `isBlank`
    - Port only `isBlank`; drop `truncate` and `normalizeEmail` (zero surviving consumer)
    - _Requirements: R7.9_
  - [x] 5.5 Create `core/seo/`
    - Relocate `seo.content.ts` (retaining `SEO_CONTENT` with both Locale branches); create `seo.service.ts` as the ported implementation exposing `initLanding`, `initServiceRoute`, `initRoute`, `initNotFound`, `initExcludedRoute`, plus `setPageMetadata` merged in as a sixth entry point with `SeoMetadata` declared inline; create `seo.assertions.ts` (`assertSeoConfigured`)
    - Delete `src/app/core/services/seo/` entirely, including `seo.model.ts`
    - _Requirements: R6.2, R6.12, R7.3, R13.1, R13.2, R13.3, R13.4, R13.5, R13.6, R13.7, R13.9, R13.10, R13.11, R13.12, R13.13, R13.14, R13.15_
  - [x] 5.6 Change the `toRoutes`/`toLazyRoutes` signatures
    - Drop the dead `locale` parameter from both functions (`toRoutes(manifest, componentByKey)`, `toLazyRoutes(manifest, loaderByKey)`); add `data: { manifestKey: entry.key }` to every emitted route object
    - _Requirements: R3.3, R7.9_
  - [x] 5.7 Create `ManifestRouteShell` at `core/routing/manifest-route-shell.ts`
    - Read `manifestKey` via `input.required<string>()` bound to route `data`; render `<h1>` bound to `metadata().title` and `<p>` bound to `metadata().description`; in `ngOnInit`, dispatch to `initLanding` (key `landing`), `initServiceRoute` (`turnkey`, `augmentation`, `sprints`, `audits`), or `initRoute` (`services-hub`, `policies`, `workflow`, `case-studies`, `contact`) per the R13.17 dispatch table
    - _Requirements: R3 (Decision Register — ManifestRouteShell), R13.17_
  - [x] 5.8 Create `ManifestNotFound` at `core/routing/manifest-not-found.ts`
    - Call `SeoService.initNotFound` on init
    - _Requirements: R3 (Decision Register), R13.9_
  - [x] 5.9 Assemble `src/app/app.routes.ts`
    - Register the `'ar'` Locale_Route_Group at a lower array index than the `''` Locale_Route_Group; each supplies the Locale_Token_Set (`LOCALE`, `LOCALE_ID`, `MAT_DATE_LOCALE: 'ar-u-nu-latn'` for `ar` / a value with primary subtag `en` for `''`) plus `LangService` in its own `providers` array
    - Each group declares `landing` eager via `toRoutes` and the other nine keys lazy via `toLazyRoutes`, plus its own `'**'` child resolving to `ManifestNotFound`
    - Register the `admin` `loadChildren` entry and the `playground` Excluded_Route outside both groups, and one trailing top-level `'**'` route
    - _Requirements: R3.2, R3.4, R3.8, R3.9, R3.10, R3.11, R3.12, R3.14, R3.15, R4.1, R4.3, R4.4, R4.5, R4.6, R4.7_
  - [x] 5.10 Assemble `src/app/app.routes.server.ts`
    - Declare `RenderMode.Client` for `admin`, `admin/**`, and `playground`; declare `RenderMode.Prerender` for the top-level `'**'` entry; declare zero entry naming a path the Route_Table resolves to no component
    - _Requirements: R2.13, R3.16, R3.17, R3.18_
  - [x] 5.11 Rewrite `LangService`
    - Derive `currentLang` from the injected `LOCALE` token (no default, fails loudly outside a Locale_Route_Group); make `direction` a `computed` off `directionFor`; remove `setLanguage()` and every `localStorage` read/write; update `[routerLink]`-based call sites in `core/i18n/components/lang.component.ts`
    - _Requirements: R4.8, R4.9, R4.10, R4.11, R4.12, R4.13, R4.14, R4.15, R4.16_
  - [x] 5.12 Register Arabic locale data and the date adapter
    - Call `registerLocaleData(localeAr, 'ar')` in both `src/main.ts` and `src/main.server.ts`; retain root `provideNativeDateAdapter()` unchanged; confirm `MAT_DATE_LOCALE: 'ar-u-nu-latn'` is the value supplied in the `'ar'` group's providers (from Task 5.9)
    - _Requirements: R5.3, R5.4, R5.5, R5.6, R5.7_
  - [x]* 5.13 Write property tests for the Path_Encoder in `path-encoder.spec.ts`
    - **Property 1: Path encode-then-decode round trip** — Validates: Requirements R12.3
    - **Property 2: Localized-path decode-then-encode round trip** — Validates: Requirements R12.4
    - _Requirements: R12.3, R12.4, R12.12_
  - [x]* 5.14 Write the `toManifestPath` unmatched-input unit test
    - Assert `toManifestPath` returns `{ locale: DEFAULT_LOCALE, path }` unchanged for every input whose first segment is not a non-default Locale, including the empty string, raising zero error
    - _Requirements: R12.5_
  - [x]* 5.15 Write per-route Arabic-digit rendering specs
    - One specification per declared Route_Manifest route rendering that route inside the `'ar'` Locale_Route_Group, failing if the output contains any code point in U+0660–U+0669 or U+06F0–U+06F9
    - _Requirements: R5.1, R5.2, R5.13_
  - [x]* 5.16 Write `SeoService` behavior specs
    - Cover the five `og:*` / four `twitter:*` tag set, hreflang element set (identical regardless of active Locale, plus `x-default`), `robots` noindex on excluded/not-found routes with cleanup on the next real route, and idempotent in-place updates on re-render
    - _Requirements: R13.3, R13.4, R13.5, R13.6, R13.7, R13.8, R13.9, R13.10, R13.11_
  - [x] 5.17 Checkpoint — Phase 5 Verification_Gate
    - `npm run build && npm test && npm run lint`. `npm run build` for `production` prerenders all 10 manifest paths across both Locales (20 HTML documents) plus both `'**'` catch-alls with zero error. Record that all ten Route_Manifest routes render in both Locales and zero entry remains unresolved under R3.4. Ensure all tests pass, ask the user if questions arise.
    - _Requirements: R2.13, R2.14, R16.6, R16.11_

- [x] 6. Admin
  - [x] 6.1 Create `admin.routes.ts`
    - Declare a pathless parent route wrapping both the login route and the shell route, supplying `AuthService`, `SubmissionsQueryService`, `SubmissionMutationsService`, `OverviewCountsService`, `ExportService` in its `providers` array and `ADMIN_CHUNK_SENTINEL` in its `data` field; register zero admin service in the application root `providers` array
    - _Requirements: R11.5, R11.6, R11.13_
  - [x] 6.2 Port `admin/auth/`
    - Add `auth.service.ts`, `auth-state.ts`, `auth.guard.ts` (`authGuard`, `loginRedirectGuard`) unchanged; delete `core/services/auth/auth.service.ts` (+ `.spec.ts`, `.errors.ts`, `auth-dialog.service.ts`) and `core/guards/auth/auth.guard.ts`, `core/guards/admin/admin.guard.ts` (+ specs)
    - Wire `authGuard` on the shell route and `loginRedirectGuard` on the login route so an unauthenticated visitor to any non-login admin path redirects to login, and an authenticated visitor to login redirects to the shell
    - _Requirements: R11.4, R11.7, R11.8_
  - [x] 6.3 Port `admin/data/`
    - Add all nine files including the `iso-week` and `tag-rules` specifications; `admin-error.ts` re-exports `FirestoreOutcomeCode` (from Task 4.3) as `AdminErrorCode` and keeps `toAdminErrorMessage`; `query-plan.ts` carries the Phase 3 (Task 3.3) generator fix already applied
    - _Requirements: R11.1, R6.6 (edge 2 decision)_
  - [x] 6.4 Port `admin/export/` and `admin/content/`
    - Add `csv.ts`, `json.ts`, `export-row.ts`, `export-row.arbitrary.ts`, `export.service.ts`; add `admin/content/admin.content.ts` unchanged, with zero file outside `src/app/admin/` importing a symbol it exports
    - _Requirements: R6.3, R11.1, R12.13_
  - [x] 6.5 Port the Admin_Page_Set
    - Add login, shell, overview, submissions-list, submission-detail pages (`.ts`/`.html`/`.scss` each) and `pages/submission-detail/humanize-label.ts`; remove `standalone: true` (4 files) and `ChangeDetectionStrategy.OnPush` (5 pages) with the now-unused import
    - Convert every admin component input/output to `input()`/`input.required()`/`output()`, and every template conditional/repetition to `@if`/`@for`/`@switch`/`@let`; convert every admin `@Injectable()` service to `@Service()`
    - _Requirements: R11.1, R11.22, R11.23, R11.24_
  - [x] 6.6 Reduce `admin/shared/admin-icon.ts` to a glyph map
    - Delete the `AdminIcon` component, its styles, and its `app-admin-icon` selector; retain `AdminIconName`; add `ADMIN_ICON_GLYPH: Record<AdminIconName, string>` mapping all 23 values per the design's Material Symbols table (21 direct kebab→snake_case matches, `error-outline`→`error`, `inventory`→`inventory_2`); bind every admin icon through `<mat-icon [name]="ADMIN_ICON_GLYPH['...']" />` with `SharedIconModule` in each component's `imports`
    - _Requirements: R11.15, R11.16_
  - [x] 6.7 Substitute `ConfirmDialogComponent` for the ported `ConfirmDialog`
    - Reduce `admin/shared/confirm-dialog.ts` to the `openAdminConfirm(dialog, message)` helper (no component, no selector); update the three call sites (`SubmissionsListPage` bulk archive, `ExportService`'s >1000-document warning, `SubmissionDetailPage` status-change confirmation) to open `ConfirmDialogComponent` from `src/app/shared/ui/dialogs/confirm-dialog/`, binding its `title`/`message`/`confirmText`/`cancelText` inputs
    - _Requirements: R11.27_
  - [x] 6.8 Add the 9 new Material override files and the 1 extended file
    - Create `components/_form-field.scss`, `_select.scss`, `_checkbox.scss`, `_chips.scss`, `_menu.scss`, `_paginator.scss`, `_progress-bar.scss`, `_progress-spinner.scss`, `_tooltip.scss` under `src/styles/ng-material/components/`, each `@include mat.<component>-overrides(( ... ))` only; register each with a `@use 'components/<name>';` line in `_index.scss`
    - _Requirements: R11.18_
  - [x] 6.9 Remap the admin token vocabulary and extract the Google mark
    - Replace the 7 custom-property references (`--color-obsidian`, `--color-surface-glass`, `--color-hairline`, `--color-accent-cyan`, `--blur-glass`, `--font-display`, `--font-mono`) with their Tailwind/M3 token equivalents per the Decision Register's remapping table; move the four-path Google "G" mark from `login-page.html` to `public/brand/google-g.svg` and render it via `<img src="/brand/google-g.svg" alt="" aria-hidden="true" width="18" height="18" />`
    - _Requirements: R11.19, R11.20, R11.21_
  - [x] 6.10 Fix the five `logical-property` flags in admin styles
    - Rewrite `admin-shell.scss`'s `border-right` to `border-inline-end` and `submissions-list-page.scss`'s `margin-right` to `margin-inline-end`; resolve the three `left`/`right` declarations inside `position: absolute`/`fixed` blocks (skip link, row overlay) as either a logical rewrite (`inset-inline-start`) or a new `PHYSICAL_PROPERTY_EXEMPTIONS` entry with a stated reason
    - _Requirements: R14.9_
  - [x] 6.11 Accessibility pass on the Admin_Page_Set
    - Supply `aria-label` on every icon-only interactive control, `aria-hidden="true"` with zero accessible name on every decorative graphic, and exactly one `<h1>` per admin page
    - _Requirements: R11.25_
  - [x] 6.12 Wire admin SEO exclusion and sitemap absence
    - Render every admin page with a `robots` noindex meta tag through `SeoService.initExcludedRoute`; confirm zero admin path in the generated `sitemap.xml` and zero link to an admin path from any route inside a Locale_Route_Group
    - _Requirements: R11.9, R11.10, R11.11_
  - [x]* 6.13 Write Component Harness specs for the five Admin_Page_Set pages
    - Use `TestbedHarnessEnvironment` with `MatTableHarness`/`MatSort` (submissions list), `MatDialogHarness` (confirm-dialog substitution), `MatFormField`/`MatSelectHarness` (login, filters); `await fixture.whenStable()` for async flows, zero `fakeAsync`/`tick`
    - _Requirements: R14.16, R14.17_
  - [x]* 6.14 Write unit tests for the admin-icon glyph map and the `LOCALE_ID`-outside-locale-groups behavior
    - Assert every `AdminIconName` resolves to a non-empty glyph string, and that the one admin `DatePipe` invocation (`submissions-list-page.html`) renders under the root `'en-US'` default
    - _Requirements: R5.15, R11.16_
  - [x] 6.15 Checkpoint — Phase 6 Verification_Gate
    - `npm run build && npm test && npm run lint`, plus the admin-chunk isolation check: for the `production` configuration, the admin chunk resolves outside the initial bundle, verified through `ADMIN_CHUNK_SENTINEL` and `assert-build-output.mjs`'s chunk-isolation assertion. Ensure all tests pass, ask the user if questions arise.
    - _Requirements: R11.14, R11.17, R11.26, R16.7_

- [x] 7. Quality-tooling
  - [x] 7.1 Create `core/build/`
    - Add `lazy-chunk-sentinels.ts` (`ADMIN_CHUNK_SENTINEL`, referenced from Task 6.1's route `data`) and `build-guards.arbitraries.ts` (`ARABIC_ALPHABET`, `arabicProse`, `arabicClaimPhrase`, `easternArabicDigit`)
    - _Requirements: R14.14, R14.15_
  - [x] 7.2 Port the seven unconditionally-invoked guard modules
    - Add `route-manifest`, `deployment-config` (with its `ReadonlyArray<…>` rewritten to `readonly (…)[]`), `firestore-index`, `secret-pattern` (scan roots gaining `shared/submission-schema/`), `strict-mode` (same array-type rewrite), `material-version`, `material-import`
    - _Requirements: R14.4, R14.11, R14.12, R10.16, R10.17_
  - [x] 7.3 Port `content-text` with its reduced input set, and drop `content-template`/`commercial-constants`
    - Reduce `content-text` guard inputs to the 20 route-metadata objects, 10 `navLabel` records, and `SEO_CONTENT`; retain `TextMatch`, `findEasternArabicNumerals`, `findPlaceholderTokens`, `findCurrencyOrRateViolations`; drop `findUnboundCommitmentNumerals`, `findRestrictedOrganizationNames`, `validateEffectiveDateIso`, `validateCarePlanCount`, `validateSelectorCardCount`, `validateWorkflowStages`
    - Do not port `content-template` (`findLiteralTextInTemplate`, `DEFAULT_TEMPLATE_TEXT_EXEMPTIONS`, `TemplateMatch`) or `commercial-constants` (`core/config/commercial-constants.ts`, `BOOKING_TARGETS`, `COMMERCIAL_CONSTANTS`, `CommercialConstants`, `BookingTarget`, `BookingTargetKey`, `commercial-constants-guards.ts`)
    - _Requirements: R14.5, R14.6, R14.8, R14.10_
  - [x] 7.4 Port `logical-property` with its reduced scan set
    - Restrict the scan set to the five admin `.scss` files and five admin `.html` templates
    - _Requirements: R14.9_
  - [x] 7.5 Assemble the Build_Guard_Suite entry point and its tooling projects
    - Rewrite `scripts/build-guards/run.ts`'s `CONTENT_SOURCES` array to 21 entries (10 `NAV_LABEL_*`, 10 `*_METADATA`, `SEO_CONTENT`), each importing through `@core/*` with zero relative specifier traversing two or more parent directories
    - Add `tsconfig.scripts.json` (`include: ["scripts/**/*.ts"]`, extending the root config); add the `functions/**/*.ts` and `scripts/**/*.ts` ESLint config blocks per the Decision Register, and apply the recorded rule suppressions/fixes (the `.catch(() => undefined)` fix, self-closing template tags, the extracted `showEmptyState` computed, the two `array-type` rewrites, the file-scoped `no-non-null-assertion` suppression in `rules-suite.spec.ts` if it fires)
    - _Requirements: R6.15, R6.16, R14.19_
  - [x] 7.6 Wire the `prebuild` script and the Sitemap_Generator
    - Run the Build_Guard_Suite entry point then `scripts/generate-sitemap.mjs`, in that order, before the Build_Pipeline; update the sitemap generator's `ENVIRONMENT_TS_PATH` to `src/environments/environment.prod.ts` and its extraction regex to `/baseUrl\s*:\s*['"]([^'"]+)['"]/`
    - Ensure the guard suite collects every failure into one array and exits non-zero only after every guard has run, printing one line per failure
    - _Requirements: R14.1, R14.2, R14.3, R13.16_
  - [x]* 7.7 Write the retained property specifications for the guard scanners
    - Retain `content-text-guards.property.spec.ts` with its reduced property set (Properties 7–11 per the Decision Register; drop Properties 1–2, which exercised the dropped `findUnboundCommitmentNumerals`/`arabicCounted`)
    - Retain `strict-mode-guards.property.spec.ts` unchanged (Properties 3–4)
    - Do not port `effective-date-guards.property.spec.ts` (both its subjects, `formatEffectiveDate` and `validateEffectiveDateIso`, are dropped)
    - _Requirements: R14.15_
  - [x] 7.8 Checkpoint — Phase 7 Verification_Gate
    - `npm run build && npm test && npm run lint`, plus `npm run prebuild` exiting 0 on its own. Confirm `assert-build` and `assert-no-any` both exit 0, and zero `fakeAsync`/`tick` usage and zero `@analogjs/vite-plugin-angular`/`vite-tsconfig-paths` dependency remain. Ensure all tests pass, ask the user if questions arise.
    - _Requirements: R14.13, R14.17, R14.18, R16.8_

- [x] 8. Documentation
  - [x] 8.1 Consolidate the Docs_Tree
    - Move the 14 page-specification files to `docs/page-specs/`, the 5 notebook-bundle files to `docs/notebook/`, the 11 completed-plan files to `docs/plans/done/`, the 4 upcoming-plan files to `docs/plans/next/`
    - _Requirements: R15.1, R15.2, R15.3, R15.4, R15.6_
  - [x] 8.2 Port `.markdownlint.json`
    - Copy the Source_Workspace root `.markdownlint.json` to the Base_Workspace root unchanged
    - _Requirements: R14.20, R15.9_
  - [x] 8.3 Verify governing-convention paths are untouched
    - Confirm every file under `.kiro/specs/`, `.kiro/skills/`, `.kiro/steering/`, and `.agents/` remains at its current path, and that the Docs_Tree contains zero duplicate of any file under `.kiro/specs/`; confirm `functions/SECRETS.md` stays beside the Cloud_Functions_Project source (already true from Task 3.5)
    - _Requirements: R15.5, R15.6, R15.7_
  - [x] 8.4 Report the stray `tmp_v.py` artefact
    - Surface the Source_Workspace root file `tmp_v.py` to the maintainer and take zero action on it without confirmation
    - _Requirements: R15.8_
  - [x] 8.5 Resolve Agent_Docs_Sync orphans
    - Confirm the Base_Workspace contains either a `.kiro/skills/prompt-evaluator/` source directory or zero `.agents/skills/prompt-evaluator/` mirror; confirm either a `.kiro/steering/auto-checklist-sync.md` source file or zero `.agents/rules/auto-checklist-sync.md` mirror; confirm the `PostFileSave` hook on `.kiro/steering|skills` still invokes the Agent_Docs_Sync and mirrors only document bodies, leaving each tool's front matter format unchanged
    - _Requirements: R15.10, R15.11, R15.12, R15.13_
  - [x] 8.6 Checkpoint — Phase 8 Verification_Gate
    - `npm run build && npm test && npm run lint`, plus `npm run sync:agents:check` exiting 0 and `setup.sh` exiting 0. Ensure all tests pass, ask the user if questions arise.
    - _Requirements: R16.9, R16.10_

## Notes

- Tasks marked with `*` are optional (tests) and can be skipped for a faster pass through a phase; every non-optional task is required before that phase's checkpoint.
- Cross-phase dependencies design.md calls out explicitly:
  - Phase 2's `@submission-schema/*` alias (Task 2.2) and the rewritten import specifiers (Task 2.4) must land before Phase 3's Cloud Functions wiring (Task 3.5) and before Phase 6's admin data layer (Task 6.3, `admin/data/submission-record.ts` and `admin/data/submissions-query.service.ts` both import through the alias).
  - Phase 3's `query-plan.ts` generator fix (Task 3.3) is applied before Phase 6 ports the rest of `admin/data/` (Task 6.3), which assumes the fix already reflected.
  - Phase 3's `core/firebase/firestore-outcome-map.ts` (`FirestoreOutcomeCode`, Task 4.3 — core-services, itself gated behind Phase 3's Deployment_Config_Set) must exist before Phase 6's `admin/data/admin-error.ts` (Task 6.3) can re-export it as `AdminErrorCode`.
  - Phase 5's route manifest resolution (Tasks 5.2–5.9, all ten keys resolved against `ManifestRouteShell`) is a prerequisite for Phase 6's admin route registration outside the locale groups (Task 6.1) — the Route_Table must already have a stable shape for `admin` to register alongside it at the correct array position.
  - Phase 1's environment reconciliation (Task 1.4) is read by Phase 7's Sitemap_Generator update (Task 7.6, `baseUrl` from `environment.prod.ts`).
- Each phase's closing checkpoint task is that phase's Verification_Gate; per R16.1/R16.12 the next phase's tasks do not begin until the current phase's checkpoint passes.
- Property tests validate the five Requirement-12 round trips (Properties 1–5) plus the two rejection properties (6–7); the guard-scanner property specs (Task 7.7) are a second, independent PBT surface over the retained guard functions themselves.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["1.4"] },
    { "id": 2, "tasks": ["1.5"] },
    { "id": 3, "tasks": ["1.6"] },
    { "id": 4, "tasks": ["1.7"] },
    { "id": 5, "tasks": ["2.1"] },
    { "id": 6, "tasks": ["2.2", "2.3"] },
    { "id": 7, "tasks": ["2.4"] },
    { "id": 8, "tasks": ["2.5"] },
    { "id": 9, "tasks": ["2.6"] },
    { "id": 10, "tasks": ["3.1"] },
    { "id": 11, "tasks": ["3.2", "3.3"] },
    { "id": 12, "tasks": ["3.4"] },
    { "id": 13, "tasks": ["3.5"] },
    { "id": 14, "tasks": ["3.6"] },
    { "id": 15, "tasks": ["3.7"] },
    { "id": 16, "tasks": ["4.1"] },
    { "id": 17, "tasks": ["4.2", "4.3"] },
    { "id": 18, "tasks": ["4.4"] },
    { "id": 19, "tasks": ["4.5"] },
    { "id": 20, "tasks": ["4.6", "4.7"] },
    { "id": 21, "tasks": ["4.8"] },
    { "id": 22, "tasks": ["5.1"] },
    { "id": 23, "tasks": ["5.2", "5.3", "5.4"] },
    { "id": 24, "tasks": ["5.5"] },
    { "id": 25, "tasks": ["5.6"] },
    { "id": 26, "tasks": ["5.7", "5.8"] },
    { "id": 27, "tasks": ["5.9"] },
    { "id": 28, "tasks": ["5.10", "5.11", "5.12"] },
    { "id": 29, "tasks": ["5.13", "5.14", "5.15", "5.16"] },
    { "id": 30, "tasks": ["5.17"] },
    { "id": 31, "tasks": ["6.1"] },
    { "id": 32, "tasks": ["6.2", "6.3", "6.4"] },
    { "id": 33, "tasks": ["6.5"] },
    { "id": 34, "tasks": ["6.6", "6.7", "6.8", "6.9"] },
    { "id": 35, "tasks": ["6.10", "6.11", "6.12"] },
    { "id": 36, "tasks": ["6.13", "6.14"] },
    { "id": 37, "tasks": ["6.15"] },
    { "id": 38, "tasks": ["7.1"] },
    { "id": 39, "tasks": ["7.2", "7.3", "7.4"] },
    { "id": 40, "tasks": ["7.5"] },
    { "id": 41, "tasks": ["7.6"] },
    { "id": 42, "tasks": ["7.7"] },
    { "id": 43, "tasks": ["7.8"] },
    { "id": 44, "tasks": ["8.1", "8.2"] },
    { "id": 45, "tasks": ["8.3", "8.4", "8.5"] },
    { "id": 46, "tasks": ["8.6"] }
  ]
}
```
