---
trigger: always_on
---

# 🏛️ Project Architectural Standards & Component Conventions

This document defines the **non-negotiable architectural standards, component guidelines, and quality rubrics** for this application.
It complements upstream tool guidelines by locking in this project's specific conventions.

---

## ⚖️ 1. The 3-Point Evaluation Rubric (Anti-Overengineering)

Before writing any new service, abstraction, helper, or file, evaluate it against three mandatory questions:

1. **Is this over-engineered?**
   - Favor simple, direct code over multi-layered abstractions.
   - Avoid generic wrapper interfaces, factory indirection, or speculative extensibility.
2. **Is it actually needed in this app?**
   - Build only what is actively required by the current features.
   - Delete dead code and unused config immediately.
3. **Is it in the right place / folder?**
   - Feature-specific code belongs inside `src/app/features/[feature-name]/`.
   - Application layout chrome belongs inside `src/app/layout/`.
   - Shared reusable UI belongs inside `src/app/shared/ui/`.
   - App-wide infrastructure belongs inside `src/app/core/`.

---

## 🧩 2. Component Architecture Standards (Modern Angular v22+)

### A. Decorator & Host Element

- **Host Binding**: Never create an `.scss` file just for `:host { display: block; }`.
  Always use `host: { class: 'block' }` directly inside the `@Component` decorator:

  ```typescript
  @Component({
    selector: 'app-user-card',
    imports: [MatButtonModule],
    templateUrl: './user-card.component.html',
    host: {
      class: 'block',
    },
  })
  export class UserCardComponent {}
  ```

- **Standalone by Default**: Do **not** write `standalone: true` (default in modern Angular).
- **OnPush by Default**: Do **not** write `changeDetection: ChangeDetectionStrategy.OnPush` (default in zoneless).
- **Selector Prefix**: Always use the project-specific `app-` prefix (never `ng-`).

### B. Reactive State & Visibility

- **Signal-First Reactivity**: Use `signal()`, `computed()`, and `effect()`. Zero Zone.js dependencies.
- **Inputs, Outputs & Models**:
  - `readonly prop = input(defaultValue)` or `readonly prop = input.required<Type>()`.
  - `readonly value = model<Type>()` for two-way bindings.
  - `readonly submitted = output<Type>()` for custom events.
  - Zero legacy `@Input()`, `@Output()`, or `@ViewChild()` decorators.
- **Strict Member Access Control**:
  - `readonly` on all inputs, models, and outputs.
  - `protected readonly` for template-bound members and derived computed signals.
  - `#private` class fields for internal state and injected services.

### C. Templates & Control Flow

- **Native Control Flow**: Use `@if`, `@for` (with mandatory `track`), `@switch`, and `@let`.
  Legacy structural directives (`*ngIf`, `*ngFor`) are strictly forbidden.
- **Self-Closing Tags**: Always use self-closing tags when elements contain no projected children:

  ```html
  <app-site-nav />
  <app-user-card [user]="user()" />
  <router-outlet />
  ```

- **Native Property Bindings**:
  - Use `[class.name]="condition"`, `[class]="{...}"`, and `[style.prop]="value"`.
  - Directives `[ngClass]` and `[ngStyle]` are forbidden.
- **Event Handler Naming**: Name methods for what they accomplish (`saveProfile()`, `toggleTheme()`), not the trigger (`handleClick()`, `onClick()`).
- **Icons**: `<mat-icon name="icon_name" />` plus `SharedIconModule` in imports. Content projection is forbidden.

### D. Lifecycle Hooks

- **Delegation-Only**: Keep `ngOnInit()` lean and clean. Delegate to well-named private methods.
- **Lifecycle Interfaces**: Always explicitly declare `implements OnInit`, `implements OnDestroy`.
- **Prefer Signals**: Use `computed()` for derived state and `DestroyRef` for cleanup instead of manual hook boilerplate.

---

## 🌍 3. Feature-Colocated `<feature>.content.ts` (i18n Architecture)

This repository enforces a **single, pure TypeScript dictionary standard** for all text and translations. Dual-tool setups (Transloco JSON + TS registries) are prohibited.

### A. The `<name>.content.ts` Pattern

Every component or feature folder owns its bilingual content dictionary colocated beside its component:

```text
src/app/features/landing/
├── landing.component.ts
├── landing.component.html
├── landing.component.spec.ts
└── landing.content.ts     <-- Colocated dictionary
```

### B. Typed Content Dictionary

```typescript
// landing.content.ts
export const LANDING_CONTENT = {
  en: {
    hero: { title: 'High-Performance Web Systems', cta: 'Explore Services' },
  },
  ar: {
    hero: { title: 'أنظمة ويب فائقة الأداء', cta: 'استكشف الخدمات' },
  },
} as const;
```

### C. Reactive Consumption in Component

```typescript
import { Component, computed, inject } from '@angular/core';
import { LangService } from '@core/i18n/services/lang.service';
import { LANDING_CONTENT } from './landing.content';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  host: { class: 'block' },
})
export class LandingComponent {
  readonly #lang = inject(LangService);
  protected readonly t = computed(() => LANDING_CONTENT[this.#lang.currentLang()]);
}
```

### D. Zero Global Constant Sprawl

- Ban on global constant proliferation (e.g. separate `NAV_LABEL_X_EN`, `NAV_LABEL_X_AR`).
- Top-level route metadata (title, description, canonical path) lives directly in [route-manifest.ts](file:///d:/Work/my-projects/angular-lab/src/app/core/routing/route-manifest.ts).

---

## 📁 4. Project Topology & File Conventions (LIFT Principle)

- **One Concept Per File**: One component, service, or model per file.
- **Avoid Generic Filenames**: Never create files named `utils.ts`, `helpers.ts`, or `common.ts`. Name files for what they actually contain (e.g., `url.utils.ts`, `date.utils.ts`).
- **Feature Encapsulation**: Features live under `src/app/features/[feature-name]/`.
- **Imports & Path Aliases**: Import using defined path aliases (`@core/*`, `@shared/*`, `@features/*`, `@env/*`). Never use deep relative traversals (`../../../`).
- **Concise Documentation**: Keep comments short, clean, and focused on non-obvious rationale ("why", not "what").

---

## 🧪 5. Testing Standards (Vitest Zoneless)

- **Philosophy**: Zoneless & Async-First.
- **The Pattern**: "Act, Wait, Assert":
  1. **Act**: Trigger action or update state.
  2. **Wait**: `await fixture.whenStable();` to let signal graph and DOM stabilize.
  3. **Assert**: Verify DOM or component state.
- **No Zone.js**: `fakeAsync` and `tick` are forbidden. Run tests via `npm test`.
