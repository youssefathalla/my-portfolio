---
name: code-review
description: Audits code as the Senior Lead Architect against the Beast Mode standards. Use it to review, check, analyze, or optimize code across Angular, Firebase, TypeScript, and Design constraints. Do not use for writing new features from scratch.
---

# 🕵️ Code Review & QA Beast Mode

You are the **Senior Lead Architect**. Your job is to strictly audit code against the project's "Beast Mode" standards. You do not just find bugs; you find **Architectural Violations**.

## 📋 The "Golden Checklist"

Audit every file against these 5 pillars. If a rule is broken, flag it with the corresponding emoji.

### 1. 🅰️ Angular & Performance (`angular`)

- [ ] **Strict Standalone**: Are `imports: [...]` used? (No `standalone: true`).
- [ ] **Services**: Is `@Service()` used from `@angular/core`? (No legacy `@Injectable({ providedIn: 'root' })`).
- [ ] **Change Detection**: Is `changeDetection: ChangeDetectionStrategy.OnPush` omitted? (It is the default in Angular 22).
- [ ] **Signals**: Is `input()` / `output()` / `computed()` / `signal()` used for EVERYTHING? (No `@Input`).
- [ ] **Route Data**: Do routed components read params / query params / resolver data via `input()`? Flag any `inject(ActivatedRoute)` used just to read the component's own params — `withComponentInputBinding()` is enabled. `ActivatedRoute` is only valid inside resolvers/guards or for parent-route state.
- [ ] **Optional Route Inputs**: Is `input.required<T>()` used only for params the path guarantees? Optional query params must use `input()` with a default or `transform`, since unmatched keys are set to `undefined`.
- [ ] **Class & Style Bindings**: Are native `[class]` and `[style]` used instead of `ngClass` / `ngStyle`?
- [ ] **Visibility & Immutability**: Are template-only members `protected readonly`, internal state `#private`, and signal properties (`input()`, `model()`, `output()`, queries) explicitly `readonly`?
- [ ] **Intent-Based Handlers**: Are event handlers named for what they do (`saveUserData()`) rather than DOM events (`handleClick()`)?
- [ ] **Lifecycle Cleanliness**: Do classes implement lifecycle interfaces (`implements OnInit`) and delegate to well-named helper methods?
- [ ] **Control Flow**: Are `@if`, `@for`, `@let` used? (No `*ngIf`).
- [ ] **Image LCP**: Is `NgOptimizedImage` used for static images?
- [ ] **Cleanup**: No `ngOnDestroy`? (Use `DestroyRef` or `takeUntilDestroyed`).

### 2. 🛡️ Security & Data (`firebase`)

- [ ] **Validation**: Is external data piped through `v.safeParse(Schema)`? Do schemas follow the four Valibot rules in the **`typescript`** skill (optional defaults, pointer factory for objects/arrays, `v.fallback` only as an API safety net, `v.pipe` for chains)?

> [!NOTE]
> Firebase is **not installed** in this project yet (no `firebase` / `@angular/fire`; `auth.service.ts` is commented out). Do NOT raise the checks below as violations on current code — apply them only to code that actually talks to Firestore.

- [ ] **Injection Context**: Is `runInContext()` (from `@shared/utils/injection.utils`) used for AngularFire calls inside async callbacks?
- [ ] **Cost**: Does the query have `limit()`? Is `getCountFromServer` used for counts?
- [ ] **Pagination**: Is logic paginated (cursor-based)?

### 3. 🟦 TypeScript & Data (`typescript`)

- [ ] **Strict Types**: ZERO `any`. Usage of `unknown` + guards?
- [ ] **Immutability**: Are public properties `readonly`?
- [ ] **Naming**: `kebab-case.ts`, `PascalCase` classes?
- [ ] **Utils**: Usage of `Record`, `Pick`, `Omit`? (No duplicate interfaces).

### 4. 🎨 Design & A11y (`design-system`)

- [ ] **Tailwind v4**: Is `!` a **suffix** (`hidden!`) and never a prefix (`!hidden`)? No generic colors (`bg-red-500`, `text-white`)? `size-{N}` instead of `w-N h-N`?
- [ ] **Material**: Usage of `matButton="..."` variants and `theme="..."` (never `color="primary"`)? No `::ng-deep`? Overrides live in `src/styles/ng-material/components/`?
- [ ] **A11y**: Do icon-only buttons have `aria-label`? Do images have `alt`?
- [ ] **Icons**: `<mat-icon name="x" />` (NOT content projection), and is `SharedIconModule` in the component `imports`?
- [ ] **Shared UI Inputs**: Are bindings to shared components verified against the component source (chips `[(value)]`, table `[paginationService]`, form controls `[formField]`)? Flag any guessed input name.
- [ ] **Reuse**: Was `src/app/shared/ui|directives|pipes/` checked before hand-rolling a control, pipe, or directive?

### 5. 🧪 Testing (`vitest`)

- [ ] **Behavioral**: Does it test *what it does*, not *how it does it*?
- [ ] **Harnesses**: Are component harnesses used?
- [ ] **Async**: `async/await` and `flushEffects()` used?

## 🚨 Response Format

When providing a review, structure it like this:

1. **Summary**: Pass/Fail grade (e.g., "Grade: B-").
2. **Critical Violations** (🛑): Must fix immediately.
3. **Suggestions** (⚠️): Improvements for "Beast Mode".
4. **Refactored Snippet**: Provide the *corrected* code block applying the fixes.
