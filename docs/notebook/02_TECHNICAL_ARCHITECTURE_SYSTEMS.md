# Dossier 02: Technical Architecture, Systems & Technology Stack

## 1. Technical Stack Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CORE TECHNOLOGY STACK                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Front-End Framework:   Angular v22 (Standalone Components, Signals Core)  │
│ • Server Engine & SSR:   @angular/ssr v22 + Express 5 Prerendering Engine   │
│ • State Management:      Angular Signals (Signal-First) + RxJS Streams      │
│ • Styling & Design:      TailwindCSS v4 (@tailwindcss/postcss) + Material   │
│ • Animations & UX:       GSAP 3.15 + Native CSS Logical Transitions         │
│ • Cloud & Backend:       Firebase 11 (Firestore NoSQL, Cloud Functions,    │
│                          Firebase Auth, App Check, Hosting)                 │
│ • API & Integrations:    REST/GraphQL APIs, Stripe, Cloud Webhooks          │
│ • Language & Compiler:   TypeScript ~6.0 (100% Strict, Zero Any Policy)     │
│ • Testing Framework:     Vitest 4 + Fast-Check (Property-Based Testing)     │
│ • Quality Tooling:       Custom Pre-build Guards, SASS/PostCSS, Prettier    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Front-End Architecture & State Management

### 2.1 Standalone Architecture & Zero NgModule Policy

- Every component, directive, and pipe is an isolated Standalone entity with direct `imports: [...]`.
- Route trees are configured with granular lazy loading via `loadComponent` and `loadChildren` to maintain minimal initial bundle sizes (< 100KB gzip for initial core shell).

### 2.2 Reactivity Model: Angular Signals & Zoneless Architecture

- **Signal-First Primitive:** Reactive state is driven by native Angular Signals (`signal()`, `computed()`, and `effect()`).
- **Component Inputs/Outputs:** Enforces the modern `input()`, `input.required()`, `output()`, and `model()` signal APIs, eliminating legacy `@Input()`/`@Output()` decorators.
- **Signal Services Integration:** For complex domain state (such as the interactive project planner, form wizards, and multi-language routing state), state is encapsulated in dedicated signal-based services with computed selectors and immutable update methods.
- **OnPush Change Detection:** All components strictly declare `changeDetection: ChangeDetectionStrategy.OnPush`. Zone.js overhead is minimized, avoiding unnecessary re-renders across the component tree.

### 2.3 SSR & Static Site Generation (SSG / Prerendering)

- Built on `@angular/ssr` and Express 5.
- All canonical public routes (English `/*` and Arabic `/ar/*`) are statically prerendered at build time (`ng build`) to guarantee:
  - Instant First Contentful Paint (FCP < 0.6s).
  - 100% SEO indexability for web crawlers without requiring client-side JS hydration.
  - Correct localized metadata, JSON-LD schemas (`WebSite`, `Person`, `Service`), and OpenGraph tags per route.

---

## 3. Serverless Backend, Data Models & Security Rules

### 3.1 Firestore Collection Structure

The primary production collection is `/submissions/{submissionId}`, handling inbound inquiries and interactive project planner wizard responses:

```typescript
interface SubmissionDocument {
  id?: string;
  type: 'contact' | 'intake-wizard';
  status: 'new' | 'in-progress' | 'archived' | 'spam';
  read: boolean;
  notes: string; // max 4,000 characters
  tags: string[]; // max 20 entries
  createdAt: Timestamp; // server timestamp
  updatedAt: Timestamp; // server timestamp
  payload: Record<string, string | number | boolean>; // 1 to 24 key-value pairs
}
```

### 3.2 Granular Firestore Security Rules (`firestore.rules`)

- **Strict Schema Shape Validation:** `isValidCreate()` enforces that only valid fields (`type`, `status`, `createdAt`, `updatedAt`, `read`, `payload`, `notes`, `tags`) can be written on creation.
- **Client Write Boundaries:** Unauthenticated clients can only invoke `create` with `status: 'new'`, `read: false`, `notes: ''`, `tags: []`, and a valid map payload size (1–24 entries).
- **Strict Admin Isolation:** Only authenticated Firebase Auth users with the custom claim `admin: true` can read (`allow read: if isAdmin()`) or update submission documents.
- **Immutable Deletions & Subcollections:** `allow delete: if false` is unconditionally enforced. Subcollections are strictly locked down.

```text
Database Access Matrix:
• Public / App Check Clients:  CREATE ONLY (with strict payload whitelist)
• Unauthenticated Readers:     DENIED (0 access)
• Admin Console / Cloud SDK:   READ + UPDATE ONLY
• Document Deletion:           DENIED (Soft-delete status flags used)
```

---

## 4. Internationalization (i18n) & Arabic RTL Engine

### 4.1 Native Bi-Directional Layout System

- The website does not use hacky CSS overrides for Arabic. Instead, it relies on **CSS Logical Properties** (e.g., `margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `border-inline-start`).
- When switching between English and Arabic, the HTML document attributes (`dir="ltr"` / `dir="rtl"` and `lang="en"` / `lang="ar"`) seamlessly adapt typography, icons, and layout flow without page reloads.

### 4.2 Complex Arabic Pluralization Engine (`arabic-plurals.ts`)

Arabic grammar requires a 6-form pluralization rule system (Zero, Singular, Dual, Few, Many, Other):

- **0 (Zero):** صيغة الصفر
- **1 (Singular):** صيغة المفرد
- **2 (Dual):** صيغة المثنى
- **3–10 (Few):** صيغة الجمع القليل
- **11–99 (Many):** صيغة الجمع الكثير
- **100+ (Other):** صيغة المئة ومضاعفاتها

The application includes an internal mathematical pluralization resolver tested with Fast-Check property testing to ensure 100% linguistic accuracy across all localized number strings.

---

## 5. Quality Assurance, Build Guards & Testing Pipeline

### 5.1 The Zero-Any Strict TypeScript Policy

- Enforced via automated build check: `npm run assert-no-any` (`scripts/assert-no-any.mjs`).
- Scans all `.ts` files to ensure no unconstrained `any` or `as any` bypasses exist in the application code.

### 5.2 Pre-Build Validation Guards (`scripts/build-guards/run.ts`)

Before any production build (`ng build`), automated pre-build guards validate:

1. **Placeholder Consistency Guard:** Verifies that no untranslated mock tokens or `{placeholder}` strings leak to production.
2. **Currency & Token Guard:** Enforces consistent multi-currency representations ($ USD, SAR, AED).
3. **Route Manifest & Sitemap Validator:** Ensures every registered route in `route-manifest.ts` has a corresponding prerender config and canonical sitemap URL.

### 5.3 Testing Pipeline (Vitest & Fast-Check)

- **Unit Testing:** Fast, parallelized test execution with Vitest across services, route resolvers, signal stores, and content registries.
- **Property-Based Testing:** Fast-Check generates thousands of random string, number, and object permutations to test edge cases in routing normalizers and language parsers.
- **Firebase Emulator Integration:** Full offline testing against local Firestore and Auth emulators (`npm run test:emulator`).
