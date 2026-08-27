# 🤖 AI Agent Collaboration Guide (Jules & Antigravity)

This repository contains a production-grade **Angular v21+ (Zoneless)** application.
Strictly adhere to these architectural directives. Deviation leads to build failures and bad UX.

## 🧠 The "Beast Mode" Protocol

### 1. 🅰️ Angular Architecture (Strict)

- **Version**: Angular v21+ (Signal-based, Zoneless).
- **Standalone**: **NEVER** use `standalone: true`. It is the default.
- **State**: Use `signal()`, `computed()`, and `effect()`. **NO** `Zone.js` reliance.
- **Control Flow**: `@if`, `@for`, `@switch` only. **NO** `*ngIf`.
- **Inputs**: `input.required()` or `input()`. **NO** `@Input`.
- **Performance**:
  - `changeDetection: ChangeDetectionStrategy.OnPush` (Mandatory).
  - `NgOptimizedImage` (`ngSrc`) for all images. Require `width`/`height` or `fill` for dynamic images.

### 2. 🛡️ Firebase & Security

- **Injection Context**: You **MUST** use the `runInContext()` pattern for all AngularFire observables to prevent context loss.
- **Validation**: Trust NOTHING. Pipe all Firestore data through a **Valibot** schema (`v.parse()`) before using it.
- **Efficiency**:
  - `limit(n)` on all list queries.
  - `getCountFromServer()` for counting.
  - Use `PaginationService` for lists.

### 3. 🎨 Design System (Tailwind v4 + Material)

- **Strict Composition**: Do NOT write custom CSS. Compose Tailwind utilities.
- **Tailwind v4**: No config references. Use `hidden!` (suffix), `bg-black/50` (slash opacity).
- **Material Integration**:
  - Use `matButton="filled | outlined | text"` (Attribute variants).
  - **NO** `::ng-deep`.
- **Icons**: Use `<mat-icon name="home" />`. **NO** content projection (`<mat-icon>home</mat-icon>`).

### 4. 🧪 Testing (Vitest)

- **Framework**: Vitest + `jsdom`. **NO** Jasmine/Karma.
- **Philosophy**: Test _Behavior_ (what it does), not implementation.
- **Tools**: Use `vi.fn()` for mocks. Use **Component Harnesses** for DOM interaction.
- **Async**: `async/await` + `flushEffects()` / `fixture.detectChanges()`.

### 5. 🛑 HARD BLOCKS - NEVER DO THESE

- **DO NOT INSTALL** `@analogjs/vite-plugin-angular` or `vite-tsconfig-paths`.
- **RATIONALE**: This project uses the **Native Angular v21+ Vitest Builder**. 3rd-party Vite plugins for Angular are deprecated for this architecture and will break the build.
- **ACTION**: If you think a dependency is missing for testing, **STOP** and ask for clarification. Do not run `npm install` for these packages.

### 6. 🚫 Forbidden Technologies

- ❌ `@angular/animations` (Strictly Forbidden. Use native CSS `animate.enter`).
- ❌ `Zone.js` dependencies (fakeAsync, tick).
- ❌ `Generic` types (`any`, `object`). Use `unknown` + Valibot.

### 7. 🧪 Testing Standards (Official Angular v21 + Vitest)

- **Native Setup**: The project uses the official `@angular/build:unit-test` builder.
- **Command**: **ALWAYS** run tests via `ng test` or `npx ng test`. **DO NOT** use `ng test --run` flag.
- **Environment**: Node.js + `jsdom`. No real browser is required.
- **Why**: `ng test` handles `tsconfig` paths (`@core`, `@shared`) without `vite-tsconfig-paths`.
- **Forbidden**: `vite-tsconfig-paths` (Uninstall if found).
- **Zoneless (Default)**: DO NOT use `fakeAsync`, `tick`, or `waitForAsync`.

## 8. SW-Point Project Standards

ALWAYS adhere to the following project-specific constraints:

### 8.1 Reusability First (UI & Utils)

- Do not repeat yourself (DRY). Check `src/app/shared/ui/`, `src/app/shared/data-access/`, and `src/app/shared/utils/` before building new components.

### 8.2 SEO Metadata Standard

- **Page-Level Only**: Inject and use the `SeoService` ONLY at the top-level Route/Page components inside `ngOnInit()`.

### 8.3 Data & Schema Separation

- Put schemas Valibot in a dedicated `.schema.ts` file in a `schema/` directory if complex.
- Put static content/dropdown lists in a `.data.ts` file in a `data/` directory.

### 8.4 Performance (@defer & SSR/SSG)

- **Dynamic/Below The Fold**: Use `@defer (hydrate on viewport)` for components far down the page.
- **Static Content (Hydrate Never)**: Use `@defer (hydrate never)` for completely static blocks.
- **Above The Fold**: DO NOT defer the main heading, Hero section, or LCP items.

### 8.5 LIFT Structure

- Place new feature modules in `src/app/features/[feature-name]/`.
- Components should co-locate styles, templates, and specs un-nested inside `<name>/<name>.component.*`.

## 9. 🔌 Kiro Powers

This workspace has the following **Kiro Powers** installed. Powers provide MCP tools and deep documentation for their domain. **Always activate the relevant power before working in its domain.**

| Domain       | Power Name | When to Activate                                                                 |
| :----------- | :--------- | :------------------------------------------------------------------------------- |
| **Angular**  | `angular`  | Any Angular CLI scaffolding, component generation, or build tooling via MCP      |
| **Firebase** | `firebase` | Any Firestore queries, Auth setup, App Hosting, Cloud Functions, or Storage work |

**Usage pattern:**

1. Call `kiroPowers action="activate"` with the relevant power name first.
2. Review the returned tools and steering files.
3. Use `kiroPowers action="use"` to invoke MCP tools from the power.

> Powers complement skills — skills provide architectural guidance, powers provide live MCP tooling.

## 🧠 Skill Routing

Do not use generic knowledge. Route every request to a specialized skill:

| User Intent                                                                       | ⏩ Activate Skill                 |
| :-------------------------------------------------------------------------------- | :-------------------------------- |
| "Explain", "Justify", "Why", "How", "Plan", "Brainstorm", "Understand"            | **`mentor`**                      |
| "Create component", "Refactor", "Scaffold", "View", "Architecture"                | **`angular-architecture`**        |
| "Angular code, components, signals, forms, DI, routing, SSR, CLI, styling"        | **`angular-developer`**           |
| "Custom directives, attribute structural host directives"                         | **`angular-directives`**          |
| "HTTP data fetching, API calls, resource(), httpResource(), Interceptors"         | **`angular-http`**                |
| "Tests", "Spec files", "Coverage", "Vitest", "Unit tests"                         | **`angular-test`**                |
| "UI, CSS, Tailwind v4, SCSS, Color, Icons, Layout, Material"                      | **`design-system`**               |
| "Discover, install, find new agent skills, extend capabilities"                   | **`find-skills`**                 |
| "Deploy Angular app", "SSR", "App Hosting", "Firebase Hosting"                    | **`firebase-app-hosting-basics`** |
| "Database", "Auth", "Firestore", "API", "Service", "Backend", "Real-time streams" | **`firebase-architecture`**       |
| "User sign-in", "Authentication", "Auth rules", "User management"                 | **`firebase-auth-basics`**        |
| "Getting started with Firebase", "Firebase setup", "Firebase CLI"                 | **`firebase-basics`**             |
| "PostgreSQL", "GraphQL", "Data Connect", "Relational database"                    | **`firebase-data-connect`**       |
| "Firestore setup", "Security rules", "Firestore SDK", "Database queries"          | **`firebase-firestore-basics`**   |
| "Types", "Interfaces", "Models", "Schema", "Utils", "Pure Logic"                  | **`typescript`**                  |
| "Review", "Audit", "Quality Check", "Improve", "Analyze", "Optimize"              | **`code-review`**                 |
