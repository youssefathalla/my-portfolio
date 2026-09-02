---
description: Decide where localized text lives — URL locale, JSON key vs typed content record, feature colocation
---

# 🌍 i18n Architecture Contract

**Where localized text lives, and who owns it.** This file is the decision layer; `translater.md` is the step-by-step workflow for extracting strings into transloco keys once you've decided a string belongs in JSON.

Two independent decisions. Do not conflate them.

---

## 1. Locale Lives in the URL

| App type                     | Locale source                                             |
| :--------------------------- | :-------------------------------------------------------- |
| Public-facing / SEO-relevant | **URL path prefix** — `/ar/contact` vs `/contact`         |
| Internal tool behind a login | User preference (profile or `localStorage`) is acceptable |

Never drive a public app's locale from `localStorage` alone. The server cannot read it, so SSR renders the default language, then the client corrects it after hydration — a visible flash of the wrong language plus a hydration mismatch. It also leaves you with one indexable URL per page instead of one per language, so `hreflang` has nothing to point at.

### Provide all three tokens in the same route group

Content locale and formatting locale MUST move together, or an Arabic page renders English month names in its datepicker.

```typescript
{
  path: 'ar',
  providers: [
    { provide: LOCALE, useValue: 'ar' as const },  // typed content indexing
    { provide: LOCALE_ID, useValue: 'ar' },        // DatePipe / CurrencyPipe / DecimalPipe
    { provide: MAT_DATE_LOCALE, useValue: 'ar' },  // Material datepicker — omit if unused
  ],
  children: [...arRoutes],
}
```

- The prefixed group (`'ar'`) MUST precede the unprefixed group (`''`) in the routes array. The router matches in order, and an empty-path group would otherwise swallow the `ar` segment.
- `LOCALE` is a custom `InjectionToken<Locale>` declared with **no default value** — resolving it outside a locale route group must fail loudly at injection, not silently return the default locale.
- `LOCALE` is not redundant with `LOCALE_ID`. `LOCALE_ID` is typed `string`; `Locale` is the narrow `'en' | 'ar'` union that makes `Record<Locale, T>` exhaustive.
- Do **not** use `@angular/localize`. It is build-time: one bundle per locale, separate deploys, no runtime switching. Not worth the deployment weight for a route-group setup.

> [!NOTE]
> Switching language is a plain `[routerLink]` navigation to the equivalent path under the other prefix. No page reload, no refresh. First load of a language (or a browser refresh) is a real request, which is the point — that URL renders correctly in that language server-side.

---

## 2. The Single Standard: Colocated `<feature>.content.ts`

All user-facing copy in this application is authored in **pure TypeScript** using colocated `<feature>.content.ts` dictionaries. Dual-tool setups and runtime JSON translation libraries (e.g. Transloco) are completely eliminated.

| Content                                                 | Storage                                                                                                    |
| :------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------- |
| Feature UI copy, headings, descriptions, buttons, forms | **Colocated `<feature>.content.ts`** — `export const FEATURE_CONTENT = { en: {...}, ar: {...} } as const;` |
| Route metadata (title, description, canonical path)     | **`ROUTE_MANIFEST` in `src/app/core/routing/route-manifest.ts`**                                           |

### Why Pure TypeScript?

1. **Zero Runtime Overhead**: No HTTP network requests to fetch JSON dictionaries at runtime, smaller bundle size, instant rendering with zero hydration flashes.
2. **Compile-Time Safety**: Missing keys or typoed property names fail immediately at compile time.
3. **Colocated by Feature**: Everything related to a feature lives together in its folder, avoiding global sprawl.

---

## 3. Organization — Colocate by Feature

Content belongs **next to the component that renders it**:

```text
src/app/
├─ core/
│  ├─ i18n/
│  │  ├─ locale.ts          # Locale, LOCALES, DEFAULT_LOCALE, LOCALE token, directionFor
│  │  └─ services/lang.service.ts
│  └─ routing/
│     └─ route-manifest.ts  # paths, nav labels, route metadata (en & ar)
└─ features/
   └─ case-studies/
      ├─ case-studies.component.ts
      ├─ case-studies.component.html
      ├─ case-studies.component.spec.ts
      └─ case-studies.content.ts   # pure TS bilingual dictionary
```

### Component Consumption Pattern

```typescript
import { Component, computed, inject } from '@angular/core';
import { LangService } from '@core/i18n/services/lang.service';
import { CASE_STUDIES_CONTENT } from './case-studies.content';

@Component({
  selector: 'app-case-studies',
  templateUrl: './case-studies.component.html',
  host: { class: 'block' },
})
export class CaseStudiesComponent {
  readonly #lang = inject(LangService);
  protected readonly t = computed(() => CASE_STUDIES_CONTENT[this.#lang.currentLang()]);
}
```

---

## 4. Anti-Patterns

| ❌ Never                                                    | ✅ Always                                           |
| :---------------------------------------------------------- | :-------------------------------------------------- |
| Runtime JSON loaders or Transloco pipes                     | Pure TypeScript colocated `<feature>.content.ts`    |
| Global constant sprawl (`NAV_LABEL_X_EN`, `NAV_LABEL_X_AR`) | Structured dictionaries or inline manifest records  |
| Locale from `localStorage` on a public SSR app              | Locale from the URL path prefix                     |
| `LOCALE` provided at app root                               | `LOCALE` provided per route group, no default value |
| `LOCALE` without `LOCALE_ID` alongside it                   | All locale tokens in the same `providers` array     |
| Empty `.scss` files just for `:host { display: block; }`    | `host: { class: 'block' }` in `@Component`          |

---

## 5. Adding a New Language

1. Widen `Locale` in `core/i18n/locale.ts` and add it to `LOCALES`. Every `Record<Locale, T>` now fails to compile — that list is your work queue.
2. Add the route group with all three tokens, ordered before the unprefixed group.
3. Add the new language branch to each `<feature>.content.ts` and `ROUTE_MANIFEST`.
4. Confirm `directionFor` returns the right direction, and check any hand-rolled formatter that assumed two locales.
