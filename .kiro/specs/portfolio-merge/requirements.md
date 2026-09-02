# Requirements Document

## Introduction

`d:\Work\my-projects\angular-lab` is the **Base_Workspace**. `d:\Work\my-projects\portfolio` is the **Source_Workspace**. This feature extracts the Source_Workspace's **backend and core logic** into the Base_Workspace and leaves the Source_Workspace's **entire presentation layer** behind.

What comes across: the whole Firebase surface (`functions/`, `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, the shared submission schema), server-side rendering, `src/app/core/` minus `scroll/` and `animation/`, `src/app/admin/` in full, and the scattered planning documents.

What stays behind: `src/app/pages/`, `src/app/sections/`, the Source_Workspace's `src/app/shared/`, `core/scroll/`, `core/animation/`, every global style file, every font family, and the roughly twenty marketing content modules. The Base_Workspace's Angular Material theme, Tailwind layers, typeface, and shared UI kit are untouched by this merge — there is no palette, typography, or `color-scheme` decision to make.

Two consequences shape most of what follows. First, the **Route_Manifest declares ten public routes whose page components are not coming**, so the manifest and the Route_Table must be reconciled rather than copied (Requirement 3). Second, **the surviving `core/` modules drag a small, forced set of content modules with them** — `seo.service.ts` imports `seo.content.ts` and `route-manifest.ts` imports `route-manifest.content.ts` — so content migration is a short, enumerable list rather than a wholesale relocation (Requirement 6).

The dominant risk remains **silent omission**: a Firestore index that no longer matches its query, a build guard that no longer runs, an Arabic label lost from a route's metadata, an admin page whose Material override quietly stopped applying. Every criterion below therefore names a condition that is checkable rather than a change that is describable. The second risk is a **single large cutover that cannot be bisected**; Requirement 16 constrains the work into independently buildable phases.

### Provenance of these requirements

This document supersedes an earlier, wider-scoped revision. The mapping below exists so prior review notes remain traceable.

| This document | Prior revision | Change |
| --- | --- | --- |
| 1, 2, 4 | R1, R2, R4 | Carried over |
| 3 | R3 | Rescoped — manifest/component reconciliation added, `component-gallery` dropped |
| 5 | R5 | Rescoped — per-page render specs replaced by admin and surviving-route specs |
| 6 | R6, R8 | Rescoped — 23 content modules reduced to the forced minimal set; R8 folded in |
| 7 | R7 | Rescoped — type surface reduced to what surviving modules consume |
| 8 | R9 | Carried over |
| 9 | R14 | Carried over, Cloud Functions split out |
| 10 | — | New: the Cloud Functions codebase as its own verifiable surface |
| 11 | R15, part of R11, part of R18 | Expanded with the reduced design-system and accessibility surface the admin pages bring |
| 12, 13, 15 | R16, R17, R20 | Carried over; R17 rescoped to surviving routes |
| 14 | R19 | Rescoped — guard retention assessed against the reduced scope |
| 16 | R21 | Rewritten phase list |
| — | R10, R11, R12, R13, R18 | Deleted: presentation layer, theme, fonts, and page-level accessibility are out of scope |

## Glossary

### Workspaces and top-level systems

- **Base_Workspace**: The `d:\Work\my-projects\angular-lab` workspace, into which all merged content lands. Its root `AGENTS.md`, `.kiro/steering/design-system.md`, and `.kiro/steering/i18n-architecture.md` are the governing conventions.
- **Source_Workspace**: The `d:\Work\my-projects\portfolio` workspace, from which the backend and core logic are ported. Read-only for the duration of the merge.
- **Merged_App**: The single Angular application present in the Base_Workspace after the merge completes.
- **Build_Pipeline**: The `@angular/build:application` builder target of the Merged_App, plus every script `npm run build` invokes before or after it.
- **Test_Runner**: The `@angular/build:unit-test` builder target of the Merged_App, invoked by `npm test`.
- **Linter**: The ESLint installation of the Base_Workspace, configured by `eslint.config.js` and invoked by `npm run lint`.
- **SSR_Server**: The Angular server-side-rendering Node application whose entry point is `src/server.ts` and whose engine is `AngularNodeAppEngine` from `@angular/ssr/node`.
- **AI_Chat_Server**: The pre-existing Express application of the Base_Workspace whose entry point is `server/server.js`, exposing `/api/health`, `/api/chat/stream`, `/api/tools/execute`, and `/api/evals/run-preset`.

### Firebase and Cloud Functions

- **Cloud_Functions_Project**: The `functions/` directory of the Merged_App, holding its own `package.json`, its own `tsconfig.json`, and its own TypeScript version, declaring `firebase-admin` and `firebase-functions` as dependencies.
- **Deployed_Function_Set**: The two function symbols the Cloud_Functions_Project entry point `functions/src/index.ts` exports: `onSubmissionCreated` and `onCalcomWebhook`.
- **Emulator_Suite**: The Firebase emulator set declared in `firebase.json` — auth 9199, firestore 8180, functions 5001, UI 4100, `singleProjectMode: true`.
- **Deployment_Config_Set**: The four deployment files `firebase.json`, `.firebaserc`, `firestore.rules`, and `firestore.indexes.json`.
- **Submission_Schema_Module**: The module exporting `SubmissionType`, `SubmissionStatus`, `SubmissionPayload`, `SubmissionDocument`, `isValidSubmissionDocument`, `isValidPayloadForType`, `toFirestoreWriteRepresentation`, `fromFirestoreReadRepresentation`, `areSubmissionDocumentsEqual`, and `classifySubmissionType`, located at `shared/submission-schema/` in the Source_Workspace.
- **Submission_Sink**: The abstract class `SubmissionSink` in `core/contact/submission-sink.ts`, declaring one `submit` operation.
- **Sink_Flag**: The `sinkFlag` boolean field of the Portfolio_Environment_Constant, selecting `FirestoreSubmissionSink` when `true` and `FormspreeSubmissionSink` when `false`.
- **Analytics_Adapter**: The abstract class `AnalyticsAdapter` in `core/analytics/analytics.ts`.
- **Analytics_Flag**: The `analyticsEnabled` boolean field of the Portfolio_Environment_Constant, selecting `RealAnalyticsAdapter` when `true` and the no-op adapter when `false`.
- **Portfolio_Environment_Constant**: The `ENVIRONMENT` constant of type `AppEnvironment` declared in the Source_Workspace at `src/app/core/config/environment.ts`, holding `formEndpoint`, `discoveryBookingUrl`, `urgentBookingUrl`, `siteBaseUrl`, `analyticsEnabled`, `firebase`, `appCheckSiteKey`, and `sinkFlag`.
- **Lab_Environment_Constant**: The `environment` constant declared in the Base_Workspace at `src/environments/environment.ts` and `src/environments/environment.prod.ts`, holding `production`, `googleMapsApiKey`, and `baseUrl`.
- **Public_Client_Identifier_Set**: The seven values the Portfolio_Environment_Constant documents as publicly disclosable — the six `firebase` web-config fields plus `measurementId` — together with `appCheckSiteKey`.

### Routing and locale

- **Route_Table**: The `Routes` array exported from `src/app/app.routes.ts` of the Merged_App.
- **Server_Route_Table**: The `ServerRoute[]` array exported from `src/app/app.routes.server.ts` of the Merged_App.
- **Route_Manifest**: The `ROUTE_MANIFEST` constant in `src/app/core/routing/route-manifest.ts`, the single declaration site of every public route path, navigation label, navigation placement, and route metadata.
- **Manifest_Route_Component**: The component a Route_Manifest entry resolves to through the `componentByKey` argument of `toRoutes` or the `loaderByKey` argument of `toLazyRoutes`.
- **Locale**: The narrow union type `'en' | 'ar'` declared in `src/app/core/i18n/locale.ts`.
- **Default_Locale**: The Locale value `'en'`, whose routes carry no path prefix.
- **Locale_Route_Group**: A top-level Route_Table entry that supplies the Locale_Token_Set through its route-level `providers` array and holds every public route of one Locale as children.
- **Locale_Token_Set**: The three providers `LOCALE`, `LOCALE_ID`, and `MAT_DATE_LOCALE`, supplied together in one `providers` array.
- **Locale_Token**: The `InjectionToken<Locale>` named `LOCALE`, declared with no default value.
- **Excluded_Route**: A route that ships in the production build and is deliberately absent from the Route_Manifest — after this merge, every route under `admin`.
- **Path_Encoder**: The `toLocalizedPath` function in `src/app/core/routing/path-encoder.ts`, which prints a bare Route_Manifest path plus a Locale as a localized path.
- **Path_Decoder**: The `toManifestPath` function in the same module, which parses a localized path back into a bare Route_Manifest path plus a Locale.
- **Lang_Service**: The `LangService` class of the Base_Workspace at `src/app/core/i18n/services/lang.service.ts`, which currently derives the active language from `localStorage`.

### Content

- **Content_Module**: A `*.content.ts` file holding localized structured content as `Record<Locale, T>` values.
- **Forced_Content_Set**: The Content_Modules the surviving `core/` and `admin/` modules import directly, and which therefore cannot be left behind: `route-manifest.content.ts`, `seo.content.ts`, and `admin/content/admin.content.ts`.
- **Core_Content_Module**: A Content_Module located under `src/app/core/`, holding content that `core/` itself consumes.
- **Admin_Content_Module**: The Content_Module at `src/app/admin/content/admin.content.ts`, holding the `ADMIN_CONTENT` constant and the `AdminNavEntry` interface, consumed only by files under `src/app/admin/`.
- **Content_Utility_Set**: The six non-`*.content.ts` residents of the Source_Workspace `src/app/content/` directory: `arabic-plurals.ts` and its specification, `effective-date.ts`, `projection.ts`, `content-registry.ts` and its specification, and `content.types.ts`.
- **Shared_Content_Type**: A type exported from the Merged_App's shared content types module, if that module survives the reduction Requirement 7 defines.
- **Translation_Catalog**: The pair of files `public/i18n/en.json` and `public/i18n/ar.json`, read at runtime by Transloco.

### Admin dashboard

- **Admin_Route_Group**: The `ADMIN_ROUTES` array exported from `src/app/admin/admin.routes.ts`, registered in the Route_Table through a single `loadChildren` entry at the unprefixed path `admin`.
- **Admin_Page_Set**: The five admin page components — login, shell, overview, submissions-list, and submission-detail — each shipping a `.ts`, a `.html`, and a `.scss` file.
- **Admin_Icon_Component**: The `AdminIcon` component at `src/app/admin/shared/admin-icon.ts`, an inline SVG sprite declaring 23 `AdminIconName` values.
- **Admin_External_Dependency_Set**: The modules outside `src/app/admin/` that files under `src/app/admin/` import: `core/firebase/firebase-app.service.ts`, `core/firebase/firestore-outcome-map.ts`, `core/platform/platform.ts`, `core/seo/seo.service.ts`, `core/build/lazy-chunk-sentinels.ts`, and the Submission_Schema_Module.
- **Export_Serializer**: The CSV and JSON serializers in `admin/export/csv.ts` and `admin/export/json.ts`.
- **Design_System_Contract**: The rules in `.kiro/steering/design-system.md` of the Base_Workspace.
- **Material_Override_Directory**: `src/styles/ng-material/components/`, the only permitted location for Angular Material token overrides.
- **Icon_Component**: The `<mat-icon name="..." />` component of the Base_Workspace, exported by `SharedIconModule` from `@shared/ui/mat-icon`.

### Tooling

- **Build_Guard_Suite**: The guard modules and the `run.ts` entry point under `scripts/build-guards/` of the Merged_App, invoked through `tsx`.
- **Source_Guard_Set**: The 11 guard modules the Source_Workspace declares: `content-text`, `route-manifest`, `commercial-constants`, `deployment-config`, `firestore-index`, `logical-property`, `material-import`, `material-version`, `secret-pattern`, `strict-mode`, and `content-template`.
- **Sitemap_Generator**: `scripts/generate-sitemap.mjs`.
- **Agent_Docs_Sync**: `scripts/sync-agent-docs.mjs` of the Base_Workspace, which mirrors `.kiro/steering` and `.kiro/skills` into `.agents/`.
- **Docs_Tree**: The `docs/` directory of the Base_Workspace after consolidation, containing `page-specs/`, `notebook/`, and `plans/{done,next}/`.
- **Path_Alias_Map**: The `compilerOptions.paths` object of the Base_Workspace `tsconfig.json`.

### Process

- **Merge_Phase**: One of the ordered, independently verifiable stages Requirement 16 defines.
- **Verification_Gate**: The command set `npm run build && npm test && npm run lint`, all three exiting zero.

## Requirements

### Requirement 1: Merged Workspace Toolchain

**User Story:** As the maintainer, I want one workspace whose build, serve, test, and lint commands all succeed, so that the merge is demonstrably complete rather than merely assembled.

#### Acceptance Criteria

1. THE Build_Pipeline SHALL complete with exit code 0 for the `production` configuration.
2. THE Build_Pipeline SHALL complete with exit code 0 for the `development` configuration.
3. THE Test_Runner SHALL complete with exit code 0 and report zero failing specs.
4. THE Linter SHALL complete with exit code 0 across every TypeScript, HTML, and JavaScript file of the Merged_App, including every ported file.
5. THE Merged_App `package.json` SHALL declare the union of the Base_Workspace scripts (`ng`, `start`, `server`, `dev`, `build`, `watch`, `test`, `lint`, `tool:intro`, `eval:support`, `eval:meeting`, `eval:opt`, `sync:agents`, `sync:agents:check`) and the four retained Source_Workspace scripts (`prebuild`, `assert-build`, `assert-no-any`, `test:emulator`).
6. WHERE a script name is declared by both workspaces with differing command text, THE Merged_App `package.json` SHALL declare exactly one entry for that name, and the design document SHALL record the retained command text and the discarded command text.
7. THE Merged_App `package.json` SHALL add `@angular/ssr`, `@angular/platform-server`, `firebase`, and `papaparse` as dependencies, and `fast-check`, `tsx`, `@types/node`, and `@types/papaparse` as development dependencies.
8. THE Merged_App `package.json` SHALL retain the `"type": "module"` field.
9. WHERE a ported script relies on CommonJS module semantics, THE merge SHALL convert that script to ECMAScript module syntax or rename that script file to a `.cjs` extension.
10. THE Merged_App `angular.json` test target SHALL retain `providersFile: "src/test-providers.ts"` and `watch: false`.
11. THE Merged_App `angular.json` build target SHALL retain `stylePreprocessorOptions.includePaths: ["src/styles"]` and SHALL retain the Base_Workspace global styles entry list `["src/tailwind.css", "src/styles.scss"]` unchanged.
12. THE Merged_App `angular.json` build target SHALL declare zero global styles entry resolving to a Source_Workspace style file.
13. THE Merged_App `tsconfig.json` SHALL retain `strict: true`, `noImplicitAny: true`, `forceConsistentCasingInFileNames: true`, `noPropertyAccessFromIndexSignature: true`, `noImplicitOverride: true`, `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true`, `isolatedModules: true`, `strictTemplates: true`, and `strictInjectionParameters: true`.
14. THE Merged_App production build budget for the `initial` bundle SHALL be set to a value the Build_Pipeline satisfies, and the design document SHALL record the chosen value, the two source values (534kB warning / 560kB error in the Source_Workspace, 2MB warning / 3MB error in the Base_Workspace), and the justification for the chosen value.
15. THE Merged_App SHALL contain exactly one environment constant module for the values the Portfolio_Environment_Constant holds, and the design document SHALL record whether those values merge into the Lab_Environment_Constant under `src/environments/`, remain at `core/config/environment.ts`, or are split across both, naming the resulting export name and import path for each of the eight fields.
16. IF the Build_Pipeline, the Test_Runner, or the Linter exits non-zero at the close of any Merge_Phase, THEN THE merge SHALL treat that Merge_Phase as incomplete.

### Requirement 2: Coexistence Of The Two Server Applications

**User Story:** As the maintainer, I want the SSR server and secondary services to run side by side without ambiguity, so that adding server-side rendering does not cause port or routing conflicts.

#### Acceptance Criteria

1. THE Merged_App SHALL declare `@angular/ssr` and `@angular/platform-server` at a version whose major and minor components equal the major and minor components of the installed `@angular/core` version.
2. THE Merged_App SHALL contain `src/main.server.ts`, `src/app/app.config.server.ts`, `src/app/app.routes.server.ts`, and the SSR_Server entry point at `src/server.ts`.
3. THE Merged_App `angular.json` build target SHALL declare `server: "src/main.server.ts"`, `ssr.entry: "src/server.ts"`, and `outputMode: "server"`.
4. THE SSR_Server entry point path `src/server.ts` SHALL differ from the AI_Chat_Server entry point path `server/server.js`, and both files SHALL be present in the Merged_App.
5. THE SSR_Server SHALL read its listening port from an environment variable name that the AI_Chat_Server reads from zero location, THE AI_Chat_Server SHALL continue reading `PORT`, and the design document SHALL record both variable names.
6. WHEN both the SSR_Server and the AI_Chat_Server start on one host with zero port-related environment variable set, THE AI_Chat_Server SHALL bind to port 3000, THE SSR_Server SHALL bind to port 4000, and both SHALL accept connections concurrently.
7. WHEN a `.env` file or shell environment sets `PORT`, THE SSR_Server SHALL bind to its own port variable value or to 4000, and SHALL bind to the `PORT` value in zero case.
8. IF the port either server resolves is already bound at startup, THEN that server SHALL exit non-zero with a message naming the resolved port number and SHALL accept zero request.
9. WHEN `npm run dev` runs, THE AI_Chat_Server and the Angular dev server SHALL both reach a listening state within 60 seconds, and `GET /api/health` SHALL return an HTTP 200 response with a JSON body containing a `status` field.
10. THE Merged_App SHALL retain the four AI_Chat_Server route handlers `/api/health`, `/api/chat/stream`, `/api/tools/execute`, and `/api/evals/run-preset`, each with the same HTTP method, the same request body field names, and the same top-level response field names the Base_Workspace declares.
11. THE SSR_Server SHALL register zero request handler on any path beginning with `/api/`, so that zero AI_Chat_Server route is served by the Angular render handler.
12. THE design document SHALL name the directory holding the AI_Chat_Server source and the directory holding the SSR build output, and those two names SHALL differ.
13. WHEN the Build_Pipeline runs for the `production` configuration, THE SSR_Server SHALL render every Route_Table path the Server_Route_Table marks for prerendering, producing exactly one HTML document per path, each containing a non-empty `<body>` element.
14. IF prerendering of any route raises an error, THEN THE Build_Pipeline SHALL exit non-zero with a message naming the offending route path and SHALL emit zero HTML document for that path.
15. IF a route reaches `window`, `document`, `localStorage`, `sessionStorage`, or `navigator` during prerendering, THEN THE Merged_App SHALL guard that access through the `isBrowser()` platform check from `core/platform/platform.ts`, and THE Build_Pipeline prerender step SHALL exit with code 0.

### Requirement 3: Route Table Structure

**User Story:** As the maintainer, I want the route manifest and the route table to agree, so that adding server-side rendering does not attempt to prerender routes whose page components were left behind.

#### Acceptance Criteria

1. THE Route_Manifest SHALL remain the single declaration site of every public route path, navigation label, navigation placement, and route metadata of the Merged_App.
2. Zero file of the Merged_App other than the Route_Manifest and the Excluded_Route registrations SHALL declare a public route path as a string literal.
3. THE Route_Table SHALL derive every public route path from the Route_Manifest through `toRoutes` or `toLazyRoutes`.
4. Every Route_Manifest entry SHALL resolve to a Manifest_Route_Component that exists in the Merged_App source tree, so that the module-evaluation-time throw `toRoutes` and `toLazyRoutes` raise for an unregistered key occurs in zero case.
5. THE design document SHALL record which of the ten Source_Workspace Route_Manifest keys (`landing`, `services-hub`, `turnkey`, `augmentation`, `sprints`, `audits`, `policies`, `workflow`, `case-studies`, `contact`) the Merged_App declares, and SHALL record for each declared key the Manifest_Route_Component that satisfies criterion 4.
6. THE design document SHALL record the reconciliation strategy for criterion 4 — a reduced initial Route_Manifest entry set, placeholder Manifest_Route_Components, or a stated combination — together with the reason the chosen strategy was preferred.
7. WHERE the Merged_App declares a Route_Manifest entry, THAT entry SHALL retain the `path`, `navLabel`, `navPlacement`, and `metadata` values the Source_Workspace declared for that key.
8. THE Route_Table SHALL contain two Locale_Route_Groups: one at path `'ar'` and one at path `''`.
9. THE Locale_Route_Group at path `'ar'` SHALL appear at a lower array index than the Locale_Route_Group at path `''`.
10. Each Locale_Route_Group SHALL declare its own `'**'` child route.
11. THE Route_Table SHALL declare one trailing top-level `'**'` route outside both Locale_Route_Groups.
12. THE Route_Table SHALL register the Admin_Route_Group outside both Locale_Route_Groups at the unprefixed path `admin` through a `loadChildren` dynamic import.
13. THE Route_Manifest SHALL contain zero entry whose key or path is `admin` or begins with `admin/`.
14. WHEN a browser requests any declared Route_Manifest path prefixed with `/ar/`, THE Merged_App SHALL render that route's Manifest_Route_Component with the Locale_Token resolving to `'ar'`.
15. WHEN a browser requests any declared Route_Manifest path with no locale prefix, THE Merged_App SHALL render that route's Manifest_Route_Component with the Locale_Token resolving to `'en'`.
16. THE Server_Route_Table SHALL declare `RenderMode.Client` for `admin` and for `admin/**`.
17. THE Server_Route_Table SHALL declare `RenderMode.Prerender` for the `'**'` catch-all entry.
18. THE Server_Route_Table SHALL declare zero entry naming a path the Route_Table resolves to no component.

### Requirement 4: Locale Token Provision

**User Story:** As a visitor reading the Arabic site, I want content language and formatting language to agree, so that an Arabic page never renders English month names.

#### Acceptance Criteria

1. Each Locale_Route_Group SHALL supply the full Locale_Token_Set in its `providers` array.
2. THE Locale_Token SHALL be declared with no default value.
3. IF the Locale_Token is injected outside a Locale_Route_Group, THEN THE Merged_App SHALL raise an injection error.
4. THE Locale_Route_Group at path `'ar'` SHALL supply `LOCALE_ID` with a value whose primary language subtag is `ar`.
5. THE Locale_Route_Group at path `''` SHALL supply `LOCALE_ID` with a value whose primary language subtag is `en`.
6. THE Merged_App SHALL contain zero provider for the Locale_Token, `LOCALE_ID`, or `MAT_DATE_LOCALE` in the application root `providers` array of `src/app/app.config.ts`.
7. THE Merged_App SHALL declare zero dependency on `@angular/localize`.
8. WHEN the active Locale is `'ar'`, THE Merged_App SHALL set the `lang` attribute of the document root element to `ar` and the `dir` attribute to `rtl`.
9. WHEN the active Locale is `'en'`, THE Merged_App SHALL set the `lang` attribute of the document root element to `en` and the `dir` attribute to `ltr`.
10. THE Merged_App SHALL derive the active Locale from the request URL path.
11. THE Lang_Service SHALL derive its active language from the route, and THE Merged_App SHALL contain zero read of `localStorage` that determines the active Locale or the active Transloco language.
12. THE Lang_Service SHALL write the active language to `localStorage` in zero case, or the design document SHALL record why a write is retained and state that the write influences zero subsequent language resolution.
13. THE `TranslocoService` active language SHALL equal the Locale resolved from the Locale_Token for every rendered route inside a Locale_Route_Group.
14. WHEN a visitor navigates from any declared Route_Manifest route to the same route under the other Locale's path prefix, THE Merged_App SHALL complete that navigation through the Angular Router, issuing zero full document reload.
15. WHEN a locale switch is requested from a path matching no Route_Manifest entry, THE Merged_App SHALL navigate to the target Locale's landing path, as `toTargetLocalePath` resolves it.
16. THE `directionFor` function SHALL return `'rtl'` for the Locale `'ar'` and `'ltr'` for the Locale `'en'`.

### Requirement 5: Latin Digits In Locale-Sensitive Formatting

**User Story:** As a visitor reading the Arabic site, I want every number and date rendered with Western Arabic digits, so that the page matches the numeral convention the rest of the site uses.

#### Acceptance Criteria

1. WHILE the active Locale is `'ar'`, THE Merged_App SHALL render every digit character appearing in a DOM text node, in an `aria-label` attribute value, in a `placeholder` attribute value, and in a `title` attribute value as a code point in the range U+0030 to U+0039.
2. WHILE the active Locale is `'ar'`, THE Merged_App SHALL render zero code point in the range U+0660 to U+0669 and zero code point in the range U+06F0 to U+06F9 in any DOM text node or in any `aria-label`, `placeholder`, or `title` attribute value, on every declared Route_Manifest route.
3. THE Locale_Route_Group at path `'ar'` SHALL supply `MAT_DATE_LOCALE` with a locale tag for which the injected date adapter's formatted output, for all 12 months of one calendar year and for all 31 day values, contains zero code point in the range U+0660 to U+0669 and zero code point in the range U+06F0 to U+06F9.
4. THE Locale_Route_Group at path `'ar'` SHALL supply `MAT_DATE_LOCALE` with a value other than the bare tag `'ar'`.
5. WHEN the Base_Workspace `<app-date-input>` component renders inside the Locale_Route_Group at path `'ar'` and its calendar panel opens, THE Merged_App SHALL render each of the 12 month names using code points in the range U+0600 to U+06FF and SHALL render every day, month, and year digit as a code point in the range U+0030 to U+0039.
6. WHEN the Base_Workspace `<app-timepicker>` component renders inside the Locale_Route_Group at path `'ar'` and its option list opens, THE Merged_App SHALL render every hour digit and every minute digit as a code point in the range U+0030 to U+0039, for all 24 hour values.
7. THE design document SHALL record the chosen `MAT_DATE_LOCALE` tag value for the Locale_Route_Group at path `'ar'`, SHALL record whether criterion 3 is satisfied by that tag alone or requires a custom `DateAdapter` implementation, and SHALL record whether the Base_Workspace root `provideNativeDateAdapter()` registration is retained or replaced.
8. WHERE the Merged_App retains `effective-date.ts`, THE Merged_App SHALL derive effective-date month names from the hand-authored per-Locale month-name records, SHALL return for each of the 12 month index values in each Locale the month name that Locale's record declares at that index, and SHALL issue zero call to `Intl.DateTimeFormat`, `toLocaleDateString`, `toLocaleTimeString`, or `toLocaleString` from the effective-date formatting path.
9. IF the effective-date formatter receives a date string that does not match the `YYYY-MM-DD` shape or whose month value falls outside the range 1 to 12, THEN THE Merged_App SHALL raise a validation error naming the offending value and SHALL render zero formatted date text.
10. WHERE the Merged_App retains `arabic-plurals.ts`, FOR ALL integer counts in the range 0 to 1000 and all five `ArabicCountedUnit` values, the string `arabicCounted` returns SHALL contain zero code point in the range U+0660 to U+0669 and zero code point in the range U+06F0 to U+06F9.
11. THE Build_Guard_Suite SHALL scan every string value of every Content_Module the Merged_App retains and every value of both Translation_Catalog files for code points in the range U+0660 to U+0669 and the range U+06F0 to U+06F9, and SHALL report one failure line per occurrence naming the constant path, the Locale key, and the zero-based character index of the occurrence.
12. IF the Build_Guard_Suite reports one or more numeral occurrences under criterion 11, THEN THE Build_Guard_Suite SHALL exit non-zero.
13. THE Test_Runner SHALL execute one specification per declared Route_Manifest route that renders that route inside the Locale_Route_Group at path `'ar'`, and SHALL fail that specification if the rendered output contains any code point in the range U+0660 to U+0669 or the range U+06F0 to U+06F9.
14. THE Test_Runner SHALL execute one specification per member of the Admin_Page_Set that renders that page and SHALL fail that specification if the rendered output contains any code point in the range U+0660 to U+0669 or the range U+06F0 to U+06F9.
15. THE Admin_Route_Group renders outside both Locale_Route_Groups, so THE design document SHALL record the `LOCALE_ID` value that resolves for the Admin_Page_Set and SHALL record the resulting output format of every `DatePipe` invocation the Admin_Page_Set templates declare.

### Requirement 6: Content Migration — The Forced Minimal Set

**User Story:** As a developer, I want only the content the surviving modules actually import to cross into the merged workspace, so that the merge does not drag twenty marketing modules along with the route manifest.

#### Acceptance Criteria

1. THE Merged_App SHALL contain zero file whose path begins with `src/app/content/` and zero directory named `content` directly under `src/app/`.
2. THE Merged_App SHALL contain the Forced_Content_Set, and the merge SHALL relocate `route-manifest.content.ts` and `seo.content.ts` to Core_Content_Modules under `src/app/core/`.
3. THE merge SHALL locate the Admin_Content_Module under `src/app/admin/`, and zero file outside `src/app/admin/` SHALL import a symbol that module exports.
4. THE Merged_App SHALL contain zero Content_Module the Source_Workspace declared and that zero surviving module of the Merged_App imports, and the design document SHALL list by file name every Source_Workspace Content_Module the merge leaves behind.
5. THE merge SHALL place each relocated Content_Module according to `.kiro/steering/i18n-architecture.md`: content that `core/` itself consumes becomes a Core_Content_Module, content that exactly one feature consumes is colocated with that feature, and an editable flat string becomes a Translation_Catalog key.
6. Zero file under `src/app/core/` SHALL declare an import specifier resolving inside `src/app/features/` or inside `src/app/admin/`.
7. Each relocated Content_Module SHALL type every exported per-Locale record as `Record<Locale, T>`.
8. THE relocation SHALL preserve every string leaf value of every relocated Content_Module code-point-for-code-point for both Locale branches, including leading whitespace, trailing whitespace, punctuation, and every non-ASCII character.
9. For every string leaf key path present in a relocated Content_Module's `en` branch, THE Merged_App SHALL contain the identical key path at the identical nesting depth in that module's `ar` branch, holding one or more non-whitespace characters.
10. For every string leaf key path present in a relocated Content_Module's `ar` branch, THE Merged_App SHALL contain the identical key path at the identical nesting depth in that module's `en` branch, holding one or more non-whitespace characters.
11. THE relocated `route-manifest.content.ts` SHALL retain, for each declared Route_Manifest key, the `NAV_LABEL_*` constant and the `*_METADATA` constant the Source_Workspace declared, each with both Locale branches populated.
12. THE relocated `seo.content.ts` SHALL retain the `SEO_CONTENT` constant with both Locale branches populated.
13. THE merge SHALL relocate each member of the Content_Utility_Set that a surviving module imports to a destination under `src/app/core/`, preserving every exported symbol name unchanged, and THE design document SHALL record one destination path per relocated file.
14. THE design document SHALL record, for each of `projection.ts`, `effective-date.ts`, and `arabic-plurals.ts`, whether a surviving consumer remains after the presentation layer is dropped, and SHALL record for each the decision to retain the file, retain a named subset of the file's exports, or leave the file behind.
15. THE Build_Guard_Suite entry point SHALL declare one content-source entry for every relocated Content_Module export the retained guards scan, each entry pairing an unchanged Source_Workspace `name` value with the relocated export it labelled, and SHALL declare zero content-source entry naming an export the merge left behind.
16. THE Build_Guard_Suite entry point SHALL reference every relocated Content_Module through a path alias declared in the Path_Alias_Map, and SHALL declare zero relative import specifier traversing two or more parent directory segments into the application source root.
17. IF any file of the Merged_App, of the Build_Guard_Suite, or of any script the Build_Pipeline invokes declares an import specifier resolving to a path under `src/app/content/`, THEN THE Build_Pipeline SHALL exit non-zero.
18. WHERE the merge retains `content-registry.ts`, THE Merged_App SHALL retain the completeness predicate `isCompleteLocaleRecord` and its specification file, and that specification SHALL assert the predicate returns `true` for every per-Locale record every relocated Content_Module exports, registering one assertion entry per exported per-Locale record.
19. THE Merged_App SHALL store button labels, form field labels, validation error messages, ARIA labels, and snack-bar messages that the surviving modules render in the Translation_Catalog, and SHALL render each such value through the `transloco` pipe or the `TranslocoService`.
20. THE Translation_Catalog files `public/i18n/en.json` and `public/i18n/ar.json` SHALL declare identical key sets, and THE Merged_App SHALL retain the `sync-i18n` skill as the mechanism that keeps the two files key-identical.
21. THE Merged_App SHALL contain zero piece of structured content whose text values reside in the Translation_Catalog while its ordering, identifiers, or discriminant values reside in a TypeScript module.
22. WHEN a Translation_Catalog key is requested and absent from the active language file, THE Merged_App SHALL be detectable as failing by the Test_Runner rather than rendering the literal key text without report.

### Requirement 7: Content Type Reduction

**User Story:** As a developer, I want the shared content types file to hold only the types the surviving modules use, so that the merge does not import 32 interfaces to serve two content modules.

#### Acceptance Criteria

1. THE Merged_App SHALL declare zero type that the Source_Workspace `content.types.ts` exported and that zero surviving module of the Merged_App references.
2. THE design document SHALL classify each of the 32 types the Source_Workspace `content.types.ts` exported as retained or dropped, giving 32 rows with zero row unresolved.
3. THE Merged_App SHALL declare `SeoContent` in the module that the relocated `seo.content.ts` imports the type from.
4. WHERE exactly one surviving module consumes a retained type, THE Merged_App SHALL declare that type in that module.
5. WHERE two or more surviving modules consume a retained type, THE Merged_App SHALL declare that type as a Shared_Content_Type in exactly one module and SHALL import it from that module at every other usage site.
6. WHERE zero type requires declaration as a Shared_Content_Type, THE Merged_App SHALL contain zero shared content types module.
7. THE Merged_App SHALL declare `RouteMetadata`, `RouteManifestEntry`, and `NavPlacement` in `src/app/core/routing/route-manifest.ts`, matching the Source_Workspace declaration site.
8. THE Merged_App SHALL declare `Locale`, `LOCALES`, `DEFAULT_LOCALE`, `Direction`, `LocalizedText`, `directionFor`, and `LOCALE` in `src/app/core/i18n/locale.ts`, and that module SHALL declare zero import of `@angular/router`, of the Route_Manifest, or of any Content_Module.
9. THE Merged_App SHALL contain zero unused import statement and zero unused exported symbol the Linter reports.

### Requirement 8: Path Alias Resolution And Dual-Project Compilation

**User Story:** As a developer, I want one unambiguous meaning for each path alias, so that an import resolves to the file the author intended and the submission schema compiles under both TypeScript projects.

#### Acceptance Criteria

1. THE Path_Alias_Map SHALL map `@shared/*` to an array holding exactly one target, and that target SHALL be `./src/app/shared/*`.
2. THE Path_Alias_Map SHALL contain zero mapping of `@shared/*` to a directory outside `./src/app/`, and SHALL retain the mappings `@core/*` to `./src/app/core/*`, `@features/*` to `./src/app/features/*`, `@layout/*` to `./src/app/layout/*`, and `@env/*` to `./src/environments/*`, each mapping to an array holding exactly one target.
3. THE Path_Alias_Map SHALL declare exactly one alias for the Submission_Schema_Module, that alias name SHALL be neither `@shared/*` nor any pattern beginning with `@shared/`, and the design document SHALL record the chosen alias name and its single target directory.
4. THE merge SHALL rewrite every Source_Workspace import specifier beginning with `@shared/submission-schema/` to the alias criterion 3 establishes, and THE Merged_App SHALL contain zero import specifier beginning with `@shared/submission-schema/`.
5. THE Base_Workspace SHALL contain exactly one copy of the Submission_Schema_Module source, and the Cloud_Functions_Project `tsconfig.json` alias and the Path_Alias_Map alias SHALL both resolve to that one directory, yielding an identical set of resolved file paths for every exported symbol name.
6. Each source file of the Submission_Schema_Module SHALL import only from a relative path resolving inside the Submission_Schema_Module directory, and SHALL reference zero type requiring a `lib` entry other than `ES2022` — in particular zero `@angular/*` import, zero `firebase-functions` import, zero `firebase-admin` import, zero `firebase/*` import, zero DOM type, and zero Node type.
7. THE Cloud_Functions_Project `tsconfig.json` SHALL resolve every file of the Submission_Schema_Module that any file under its `include` set imports, and the design document SHALL record the change required to `rootDir`, to `include`, or to both, given that the Source_Workspace declares `rootDir: "./src"` and `paths: { "@shared/*": ["../shared/*"] }` together while zero file under `functions/src/` imports the Submission_Schema_Module today.
8. WHEN the Cloud Functions build runs, THE Cloud_Functions_Project SHALL compile every file it resolves under its own declared TypeScript 5.8.x version with `module` and `moduleResolution` set to `Node16`, reporting zero error and exiting with code 0.
9. WHEN the Build_Pipeline runs, THE Merged_App TypeScript project SHALL compile every file of the Submission_Schema_Module under its own declared TypeScript 6.0.x version with `module` set to `preserve`, reporting zero error and exiting with code 0.
10. THE Merged_App TypeScript configuration and the Cloud_Functions_Project TypeScript configuration SHALL each declare `strict: true`, `isolatedModules: true`, `noImplicitOverride: true`, `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true`, and `noPropertyAccessFromIndexSignature: true`, so that the Submission_Schema_Module compiles under identical strictness in both projects.
11. THE Merged_App SHALL contain zero relative import specifier holding three or more `../` segments, and every import crossing a top-level directory of `src/app/` SHALL use a Path_Alias_Map alias.
12. THE Merged_App `tsconfig.spec.json` SHALL resolve every specification file under the application source root and every specification file of the Submission_Schema_Module, and the count of specification files it resolves SHALL be greater than or equal to the count the Base_Workspace and the ported specification files contain together.
13. IF a Submission_Schema_Module source file contains an import specifier or a syntax construct that either TypeScript project cannot resolve or cannot parse, THEN THE Build_Pipeline SHALL exit non-zero and SHALL report the offending file path, the offending specifier or construct, and which of the two projects rejected it.
14. IF either TypeScript project reports one or more type errors within the Submission_Schema_Module, THEN THE Build_Pipeline SHALL exit non-zero, SHALL emit zero deployable build artefact, and SHALL leave the previously built output unmodified.

### Requirement 9: Firebase Installation And Contact Submission

**User Story:** As a visitor, I want the contact form to deliver my enquiry, so that submitting the form has an effect.

#### Acceptance Criteria

1. THE Merged_App SHALL declare `firebase` as a dependency.
2. THE Base_Workspace SHALL contain the Deployment_Config_Set at its repository root.
3. THE Merged_App SHALL contain `core/firebase/firebase-app.service.ts`, `core/firebase/firestore-outcome-map.ts` and its specification, `core/contact/submission-sink.ts`, `core/contact/firestore-submission-sink.ts`, and `core/contact/formspree-submission-sink.ts`.
4. THE Merged_App SHALL register the Submission_Sink abstract class as the injection token every contact consumer depends on.
5. WHILE the Sink_Flag is `true`, THE Merged_App SHALL resolve the Submission_Sink to `FirestoreSubmissionSink`.
6. WHILE the Sink_Flag is `false`, THE Merged_App SHALL resolve the Submission_Sink to `FormspreeSubmissionSink`.
7. WHEN the Sink_Flag value changes, THE Merged_App SHALL require zero edit to any component source file.
8. THE Merged_App SHALL contain `core/analytics/analytics.ts` and `core/analytics/real-analytics-adapter.ts` with its specification.
9. WHILE the Analytics_Flag is `true`, THE Merged_App SHALL resolve the Analytics_Adapter to `RealAnalyticsAdapter`.
10. WHILE the Analytics_Flag is `false`, THE Merged_App SHALL resolve the Analytics_Adapter to the no-op adapter and SHALL issue zero analytics network request.
11. THE Merged_App SHALL initialize the Firebase application at most once per browser session.
12. IF the Merged_App runs in a non-browser context, THEN THE Firebase handle accessor SHALL resolve to `null` and SHALL issue zero dynamic import of a `firebase/*` module.
13. IF any of the Firebase configuration fields `apiKey`, `authDomain`, `projectId`, or `appId` holds zero non-whitespace characters, THEN THE Firebase handle accessor SHALL resolve to `null`.
14. IF Firebase initialization exceeds 10 seconds, THEN THE Firebase handle accessor SHALL resolve to `null` and SHALL raise zero uncaught error.
15. THE Merged_App SHALL invoke every AngularFire call issued from an asynchronous callback through the `runInContext()` runner from `@shared/utils/injection.utils`.
16. THE Merged_App SHALL apply a `limit(n)` constraint to every Firestore list query and SHALL obtain every document count through `getCountFromServer()`.
17. WHEN a submission is dispatched with the Sink_Flag set to `true`, THE Merged_App SHALL write one document satisfying `isValidSubmissionDocument` to Firestore and SHALL surface a submission outcome to the caller.
18. IF the Firestore write fails, THEN THE Merged_App SHALL map the Firestore error through `mapFirestoreErrorToAdminError` or the equivalent outcome map and SHALL surface an error outcome naming the mapped outcome code.
19. THE `isConfiguredUrl` predicate SHALL classify a value as configured only when that value is non-blank, at most 2048 characters, and parses as an absolute URL using the `https` scheme.
20. IF `formEndpoint`, `discoveryBookingUrl`, or `urgentBookingUrl` fails `isConfiguredUrl`, THEN THE dependent feature SHALL render its defined fallback state.
21. THE Merged_App SHALL contain zero API key, access token, password, private key, or signing secret in any version-controlled source file, excepting the Public_Client_Identifier_Set.

### Requirement 10: Cloud Functions Port

**User Story:** As the site owner, I want the notification and booking-webhook functions to keep deploying and keep passing their rules suite, so that a submitted enquiry still triggers a notification after the merge.

#### Acceptance Criteria

1. THE Base_Workspace SHALL contain the Cloud_Functions_Project with the seven ported source files `index.ts`, `notification-function.ts`, `webhook-function.ts`, `rate-limit.ts`, `spam-heuristic.ts`, `booking-event.ts`, and `rules-suite.spec.ts`, plus `scripts/set-admin-claim.mjs`, `SECRETS.md`, `package.json`, and `tsconfig.json`.
2. THE Cloud_Functions_Project `functions/src/index.ts` SHALL export exactly the Deployed_Function_Set.
3. THE Cloud_Functions_Project SHALL declare its own `package.json` with `firebase-admin` and `firebase-functions` as dependencies, `@firebase/rules-unit-testing`, `typescript`, and `vitest` as development dependencies, and `engines.node` set to the same major version `firebase.json` declares as the functions runtime.
4. THE Cloud_Functions_Project SHALL declare a TypeScript version whose major and minor components are 5 and 8, and the Merged_App SHALL declare a TypeScript version whose major and minor components are 6 and 0, so that the two projects compile independently.
5. WHEN `npm run build` runs inside the Cloud_Functions_Project, THE TypeScript compiler SHALL exit with code 0 and SHALL emit one JavaScript file and one declaration file per compiled source file into `functions/lib/`.
6. THE Cloud_Functions_Project SHALL exclude every `*.spec.ts` file from its emit set.
7. THE Merged_App root `package.json` SHALL declare zero dependency on `firebase-admin` and zero dependency on `firebase-functions`.
8. THE Merged_App SHALL contain zero `import` of a `firebase-admin/*` module or a `firebase-functions/*` module in any file under `src/`.
9. THE `firebase.json` file SHALL declare the Emulator_Suite ports auth 9199, firestore 8180, functions 5001, and UI 4100, and SHALL declare `singleProjectMode: true`.
10. THE Emulator_Suite port set SHALL contain zero port equal to the port the SSR_Server resolves or the port the AI_Chat_Server resolves.
11. WHEN `npm run test:emulator` runs against the Emulator_Suite, THE Firestore rules suite `functions/src/rules-suite.spec.ts` SHALL exit with code 0.
12. THE `firestore.indexes.json` file SHALL declare one composite index for every Firestore query the Merged_App issues that requires one, and THE Build_Guard_Suite SHALL report one failure line per query whose required index is absent.
13. THE merge SHALL leave `functions/SECRETS.md` inside the `functions/` directory rather than relocating that file into the Docs_Tree.
14. THE Cloud_Functions_Project SHALL resolve every secret value through `defineSecret` at deploy time, and SHALL contain zero secret value as a source literal.
15. THE `scripts/set-admin-claim.mjs` script SHALL remain executable through the Cloud_Functions_Project `set-admin` script entry.
16. THE Build_Guard_Suite SHALL scan every source file under the Merged_App source root and under the Cloud_Functions_Project source root, plus the Deployment_Config_Set, for secret-shaped patterns, and SHALL report each occurrence as a file path, a line number, and a pattern name with zero character of the matched value printed.
17. THE Build_Guard_Suite SHALL resolve every path the Deployment_Config_Set references and SHALL report one failure line per path resolving to no file.

### Requirement 11: Admin Dashboard Port

**User Story:** As the site owner, I want the admin dashboard to keep working behind authentication and to look like the rest of the merged application, so that submitted enquiries remain reviewable without a second styling vocabulary in the codebase.

#### Acceptance Criteria

1. THE Merged_App SHALL contain the ported `src/app/admin/` tree: `admin.routes.ts`, the three `auth/` files, the Admin_Content_Module, the nine `data/` files including the `iso-week` and `tag-rules` specifications, the five `export/` files, the Admin_Page_Set with one `.ts`, one `.html`, and one `.scss` file each, `pages/submission-detail/humanize-label.ts`, `shared/admin-icon.ts`, and `shared/confirm-dialog.ts`.
2. Every import specifier declared by a file under `src/app/admin/` SHALL resolve either inside `src/app/admin/`, or to a member of the Admin_External_Dependency_Set, or to an `@angular/*` package.
3. THE Merged_App SHALL contain every member of the Admin_External_Dependency_Set, so that criterion 2 resolves for every file.
4. THE Merged_App SHALL contain exactly one authentication service, and the design document SHALL state whether that service is the ported Source_Workspace `admin/auth/auth.service.ts` or the revived Base_Workspace `core/services/auth/auth.service.ts`, and SHALL record the disposition of the discarded implementation and of the Base_Workspace `core/guards/auth/` and `core/guards/admin/` guards.
5. THE Admin_Route_Group SHALL declare its `providers` array on a pathless parent route that wraps both the login route and the shell route, so that `loginRedirectGuard` resolves the authentication service from the login route.
6. THE Merged_App SHALL register zero admin service in the application root `providers` array.
7. WHEN an unauthenticated visitor requests any path under `admin` other than the login path, THE Merged_App SHALL redirect that visitor to the admin login path.
8. WHEN an authenticated visitor requests the admin login path, THE Merged_App SHALL redirect that visitor to the admin shell path.
9. THE Merged_App SHALL render every admin page with a `robots` meta tag whose content value directs no indexing, set through the `SeoService` excluded-route entry point.
10. THE Merged_App SHALL contain zero admin path in the generated `sitemap.xml`.
11. THE Merged_App SHALL render zero link to an admin path from any route inside a Locale_Route_Group.
12. THE Merged_App SHALL declare `papaparse` as a dependency and SHALL retain the admin CSV export capability.
13. THE Admin_Route_Group SHALL retain `ADMIN_CHUNK_SENTINEL` in its route `data` field, so that the build-output assertion detecting the admin chunk in the initial bundle continues to fire.
14. WHEN the Build_Pipeline runs for the `production` configuration, THE admin chunk SHALL resolve outside the initial bundle.
15. THE Merged_App SHALL render every icon the admin pages display through the Icon_Component, and every component that renders `<mat-icon>` SHALL declare `SharedIconModule` in its `imports` array.
16. THE Merged_App SHALL contain zero component whose selector is `app-admin-icon`, and the design document SHALL record the Material Symbols glyph name chosen for each of the 23 `AdminIconName` values, giving 23 rows with zero row unresolved.
17. THE Merged_App SHALL contain zero occurrence of `::ng-deep` in any admin style file, and zero admin style rule whose selector targets an Angular Material internal element class.
18. THE Merged_App SHALL declare every Angular Material token override the admin pages require through `@include mat.<component>-overrides(( ... ))` inside a file under the Material_Override_Directory, and the design document SHALL list every Material component the Source_Workspace admin pages styled outside that directory together with the receiving override file.
19. THE admin templates and admin style files SHALL express every color through a semantic Design_System_Contract token, and SHALL contain zero raw Tailwind palette utility and zero hard-coded hexadecimal color literal.
20. THE admin templates SHALL contain zero `color` attribute binding on an Angular Material component and SHALL express status coloring through the `theme` attribute.
21. THE admin templates and admin style files SHALL express every important modifier as a class-name suffix, every equal width-and-height sizing through the `size-{N}` utility, every alpha composite through slash opacity notation, and every heading typography through the Design_System_Contract type-scale classes.
22. THE Merged_App SHALL contain zero admin component declared with `standalone: true` and zero admin component declared with `changeDetection: ChangeDetectionStrategy.OnPush`.
23. THE Merged_App SHALL declare every ported admin service with the `@Service()` decorator from `@angular/core`.
24. THE Merged_App SHALL declare every admin component input through `input()` or `input.required()` and every admin component output through `output()`, and SHALL render every admin template conditional and repetition through `@if`, `@for`, `@switch`, or `@let`.
25. THE Merged_App SHALL supply an accessible name for every icon-only interactive control the admin pages render through an `aria-label` attribute, SHALL render every decorative graphic with `aria-hidden="true"` and zero accessible name, and SHALL render exactly one `<h1>` element per admin page.
26. Each admin style file SHALL compile to a size within the `anyComponentStyle` error budget the Merged_App `angular.json` declares.
27. WHERE the merge reuses a Base_Workspace shared component in place of a ported admin component, THE design document SHALL name the retained implementation and the discarded implementation, and THE Merged_App SHALL bind every input using the name the retained component's source declares.

### Requirement 12: Parser, Printer, And Serializer Round Trips

**User Story:** As a developer, I want every value that crosses a format boundary to survive the round trip, so that a locale prefix, an exported row, or a stored document is never silently corrupted.

#### Acceptance Criteria

1. THE Path_Encoder SHALL print a bare Route_Manifest path and a Locale as a localized path.
2. THE Path_Decoder SHALL parse a localized path into a bare Route_Manifest path and a Locale.
3. FOR ALL Route_Manifest paths and all Locale values, applying the Path_Encoder then the Path_Decoder SHALL yield the original path and the original Locale.
4. FOR ALL localized paths the Path_Encoder produces, applying the Path_Decoder then the Path_Encoder SHALL yield the original localized path.
5. THE Path_Decoder SHALL return `{ locale: DEFAULT_LOCALE, path }` unchanged for every input whose first path segment is not a non-default Locale value, including the empty string, and SHALL raise zero error for any string input.
6. THE Merged_App SHALL declare the Path_Encoder and the Path_Decoder in a module that imports zero Content_Module, and the Route_Manifest module SHALL re-export both functions.
7. FOR ALL `SubmissionDocument` values, applying `toFirestoreWriteRepresentation` then `fromFirestoreReadRepresentation` SHALL yield a document for which `areSubmissionDocumentsEqual` returns `true` against the original.
8. FOR ALL export-row values, applying the CSV Export_Serializer then a CSV parse SHALL yield the original field values.
9. FOR ALL export-row values, applying the JSON Export_Serializer then `JSON.parse` SHALL yield the original field values.
10. IF `isValidSubmissionDocument` returns `false` for a candidate value, THEN THE Merged_App SHALL reject that value and SHALL raise a descriptive validation error.
11. IF `isValidPayloadForType` returns `false` for a payload and type pair, THEN THE Merged_App SHALL reject that pair and SHALL raise a descriptive validation error.
12. THE Merged_App SHALL declare `fast-check` as a development dependency and SHALL express criteria 3, 4, 7, 8, and 9 as property-based tests.
13. THE Merged_App SHALL retain `admin/export/export-row.arbitrary.ts` as the arbitraries module backing the export-row property tests.

### Requirement 13: Search Engine Metadata Preservation

**User Story:** As the site owner, I want the merged site to keep its indexing and social-preview behaviour for the routes that survive, so that search visibility is not lost to the merge.

#### Acceptance Criteria

1. THE Merged_App SHALL contain exactly one class named `SeoService`.
2. THE retained `SeoService` SHALL expose the Source_Workspace entry points `initLanding`, `initServiceRoute`, `initRoute`, `initNotFound`, and `initExcludedRoute`, and SHALL expose the Base_Workspace entry point `setPageMetadata`, and the design document SHALL record the disposition of the Base_Workspace `core/services/seo/seo.model.ts` types.
3. WHEN a declared Route_Manifest route renders, THE `SeoService` SHALL set the document title, the meta description, the canonical link, five `og:*` tags, and four `twitter:*` tags.
4. THE `SeoService` SHALL set the `og:title` content value equal to the document title text.
5. THE `SeoService` SHALL set the `og:url` content value equal to the canonical link `href` value.
6. THE `SeoService` SHALL set each `twitter:title`, `twitter:description`, and `twitter:image` content value equal to its corresponding `og:*` content value.
7. WHEN a declared Route_Manifest route renders, THE `SeoService` SHALL emit one `<link rel="alternate" hreflang="...">` element per Locale plus one `hreflang="x-default"` element pointing at the Default_Locale canonical URL.
8. THE `hreflang` element set the `SeoService` emits for a given route SHALL be identical regardless of which Locale is active.
9. WHEN an Excluded_Route or the not-found view renders, THE `SeoService` SHALL set a `robots` meta tag directing no indexing and SHALL remove any canonical link and any `hreflang` element a previously rendered route left in the document head.
10. WHEN a declared Route_Manifest route renders after the not-found view, THE `SeoService` SHALL remove the `robots` meta tag the not-found view set.
11. WHEN the same route renders a second time, THE `SeoService` SHALL update the existing tags, canonical link, `hreflang` elements, and JSON-LD scripts in place and SHALL create zero duplicate element.
12. THE `SeoService` SHALL derive every canonical URL through `toCanonicalUrl` and SHALL contain zero second derivation of a canonical URL.
13. IF a required metadata field or `siteBaseUrl` holds zero non-whitespace characters, THEN `assertSeoConfigured` SHALL raise an error naming the offending route key and field, and THE Build_Pipeline SHALL exit non-zero.
14. THE Merged_App SHALL invoke a `SeoService` entry point exclusively from top-level route components and exclusively from the `ngOnInit` lifecycle hook.
15. THE `SeoService` SHALL set every element it owns through APIs that execute during prerendering, and the design document SHALL record that `HTMLElement.dataset` assignment is unavailable in the prerender DOM implementation.
16. THE Sitemap_Generator SHALL produce one `sitemap.xml` entry per declared Route_Manifest path per Locale and zero entry for any Excluded_Route.
17. WHERE the Merged_App declares zero Route_Manifest entry whose Manifest_Route_Component invokes `initLanding` or `initServiceRoute`, THE design document SHALL record whether those two entry points are retained for a later phase or removed.

### Requirement 14: Quality Tooling Preservation

**User Story:** As the maintainer, I want the build guards that still have inputs to keep running, and the ones that no longer do to be removed by decision rather than by neglect, so that a passing prebuild means something.

#### Acceptance Criteria

1. THE Merged_App `prebuild` script SHALL run the Build_Guard_Suite entry point and the Sitemap_Generator, in that order, before the Build_Pipeline.
2. THE Build_Guard_Suite SHALL collect every failure of every guard before exiting and SHALL print one line per failure.
3. IF the Build_Guard_Suite collects one or more failures, THEN THE Build_Guard_Suite SHALL exit non-zero.
4. THE Merged_App SHALL retain the seven guard modules `route-manifest`, `deployment-config`, `firestore-index`, `secret-pattern`, `strict-mode`, `material-version`, and `material-import`, each invoked unconditionally by the Build_Guard_Suite entry point.
5. THE Merged_App SHALL retain the `content-text` guard with its input set reduced to the route-metadata constants of the relocated `route-manifest.content.ts` and the constants of the relocated `seo.content.ts`.
6. THE retained `content-text` guard SHALL assert a document title length in the range 30 to 60 characters inclusive and a meta description length in the range 120 to 160 characters inclusive, for every declared Route_Manifest entry in both Locales.
7. THE design document SHALL record, for each of the 11 members of the Source_Guard_Set, the disposition retained, retained-with-reduced-input, or dropped, giving 11 rows with zero row unresolved.
8. THE design document SHALL record the disposition of the `content-template` guard as dropped, naming the absence of ported page templates as the reason.
9. THE design document SHALL record the disposition of the `logical-property` guard, and SHALL state whether that guard is retained with its scan set reduced to the admin style files and admin templates or dropped, naming the reason for the chosen disposition.
10. THE design document SHALL record whether `core/config/commercial-constants.ts` retains a consumer in the Merged_App, and SHALL record the resulting disposition of both that file and the `commercial-constants` guard.
11. THE Build_Guard_Suite SHALL read the live `tsconfig.json` compiler options and SHALL report a failure for every retained content string asserting a strictness setting the configuration does not declare.
12. THE Build_Guard_Suite SHALL compare the installed `@angular/material` version against the installed `@angular/cdk` version and SHALL report a failure when the two versions are unaligned.
13. THE Merged_App SHALL retain the `assert-build` and `assert-no-any` scripts, and both SHALL exit 0.
14. THE Merged_App SHALL retain `core/build/lazy-chunk-sentinels.ts`, and every sentinel constant that module exports SHALL be referenced by a route configuration object the Merged_App emits.
15. THE Merged_App SHALL retain `core/build/build-guards.arbitraries.ts` together with each of the three ported property specification files whose guard survives criterion 7, and THE design document SHALL record which of `content-text-guards.property.spec.ts`, `effective-date-guards.property.spec.ts`, and `strict-mode-guards.property.spec.ts` is retained.
16. THE Test_Runner SHALL execute every retained ported specification file.
17. THE Merged_App SHALL contain zero use of `fakeAsync` and zero use of `tick`.
18. THE Merged_App SHALL declare zero dependency on `@analogjs/vite-plugin-angular` and zero dependency on `vite-tsconfig-paths`.
19. THE Linter SHALL apply the Base_Workspace `eslint.config.js` configuration to every ported TypeScript file and every ported template, and the design document SHALL record every rule suppression the ported code requires together with the reason for each suppression.
20. THE Base_Workspace SHALL contain a `.markdownlint.json` configuration governing every Markdown file the Docs_Tree holds.

### Requirement 15: Documentation Consolidation

**User Story:** As the maintainer, I want the scattered planning and specification documents in one tree, so that finding a document does not require knowing which folder it landed in historically.

#### Acceptance Criteria

1. THE Docs_Tree SHALL contain the 14 page-specification files under `docs/page-specs/`.
2. THE Docs_Tree SHALL contain the 5 notebook-bundle files under `docs/notebook/`.
3. THE Docs_Tree SHALL contain the 11 completed-plan files under `docs/plans/done/`.
4. THE Docs_Tree SHALL contain the 4 upcoming-plan files under `docs/plans/next/`.
5. THE merge SHALL leave every file under `.kiro/specs/`, `.kiro/skills/`, `.kiro/steering/`, and `.agents/` at its current path.
6. THE Docs_Tree SHALL contain zero duplicate of any file present under `.kiro/specs/`.
7. THE merge SHALL leave `functions/SECRETS.md` beside the Cloud_Functions_Project source.
8. THE merge SHALL report the stray Source_Workspace root artefact `tmp_v.py` to the maintainer and SHALL take zero action on that file without maintainer confirmation.
9. THE `npm run sync:agents:check` script SHALL exit 0.
10. THE Base_Workspace SHALL contain either a `.kiro/skills/prompt-evaluator/` source directory or zero `.agents/skills/prompt-evaluator/` mirror directory.
11. THE Base_Workspace SHALL contain either a `.kiro/steering/auto-checklist-sync.md` source file or zero `.agents/rules/auto-checklist-sync.md` mirror file.
12. THE Agent_Docs_Sync SHALL mirror only document bodies and SHALL leave each tool's front matter format unchanged.
13. WHEN a file under `.kiro/steering/` or `.kiro/skills/` is saved, THE Base_Workspace hook configuration SHALL invoke the Agent_Docs_Sync.
14. THE `setup.sh` script SHALL exit 0.

### Requirement 16: Incremental Merge Sequence

**User Story:** As the maintainer, I want the merge delivered in phases that each build and test on their own, so that a regression can be traced to one phase instead of one enormous commit.

#### Acceptance Criteria

1. THE merge SHALL proceed through Merge_Phases in ascending order, and each Merge_Phase SHALL pass the Verification_Gate before the next Merge_Phase begins.
2. THE merge SHALL execute a configuration-and-SSR Merge_Phase first, establishing the merged dependency set, the merged script set, the merged `angular.json` build and test targets, the SSR entry points, the SSR port variable, and the initial-bundle budget.
3. THE merge SHALL execute a submission-schema Merge_Phase second, establishing the single copy of the Submission_Schema_Module, the Path_Alias_Map alias that addresses it, the Cloud_Functions_Project `tsconfig.json` resolution of that alias, and a compilation of that module under both TypeScript projects.
4. THE merge SHALL execute a Firebase-and-functions Merge_Phase third, establishing the Deployment_Config_Set, the Cloud_Functions_Project, and the Emulator_Suite, and SHALL close that Merge_Phase with `npm run test:emulator` exiting 0.
5. THE merge SHALL execute a core-services Merge_Phase fourth, establishing `core/config/`, `core/platform/`, `core/analytics/`, `core/firebase/`, and `core/contact/` together with the Sink_Flag and Analytics_Flag provider swap points.
6. THE merge SHALL execute a locale-routing-and-SEO Merge_Phase fifth, establishing `core/i18n/locale.ts`, the Locale_Token_Set, `core/routing/`, `core/seo/`, `core/text/`, the Forced_Content_Set, the retained Content_Utility_Set members, and the two Locale_Route_Groups reconciled against the Route_Manifest per Requirement 3.
7. THE merge SHALL execute the admin Merge_Phase sixth, after the Firebase-and-functions Merge_Phase and after the core-services Merge_Phase, establishing the Admin_Route_Group, the Admin_Page_Set, the design-system reconciliation of Requirement 11, and the authentication service decision.
8. THE merge SHALL execute a quality-tooling Merge_Phase seventh, establishing `core/build/`, the Build_Guard_Suite with its retained guard set, the `prebuild` script, and the Sitemap_Generator.
9. THE merge SHALL execute a documentation Merge_Phase last, performing the Docs_Tree consolidation and the Agent_Docs_Sync orphan resolution.
10. THE merge SHALL declare zero Merge_Phase whose deliverable is a page component or a landing-page section component.
11. WHEN a Merge_Phase completes, THE merge SHALL record which Route_Manifest routes render in both Locales at that point and which Route_Manifest entries remain unresolved under Requirement 3 criterion 4.
12. IF a Merge_Phase cannot pass the Verification_Gate, THEN THE merge SHALL resolve the failure inside that Merge_Phase rather than deferring the failure to a later Merge_Phase.
13. THE Source_Workspace SHALL remain unmodified for the duration of the merge.
