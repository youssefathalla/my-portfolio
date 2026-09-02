# Dossier 03: Codebase Topology, Core Modules & Component Architecture

## 1. High-Level Workspace Structure

```text
d:/Work/portfolio/
├── angular.json                     # Angular CLI 22 build, SSR & prerender configuration
├── firebase.json                    # Firebase hosting rewrites, headers & Cloud Functions config
├── firestore.indexes.json           # Compound query indexes for /submissions collection
├── firestore.rules                  # Strict server-side access control & data validation rules
├── package.json                     # Dependencies, scripts & build pipelines
├── tsconfig.json                    # TypeScript strict mode & path alias configurations
├── functions/                       # Serverless Cloud Functions (email triggers, lead webhooks)
├── scripts/                         # Build verification, guards, and sitemap generation
│   ├── assert-build-output.mjs      # Verifies prerendered HTML output & asset integrity
│   ├── assert-no-any.mjs            # Static code analysis enforcing Zero-Any policy
│   ├── generate-sitemap.mjs         # Automatic XML sitemap generation with hreflang tags
│   └── build-guards/                # Pre-build validation suite (placeholders, currencies)
└── src/
    ├── main.ts                      # Client entry point
    ├── main.server.ts               # SSR / prerendering server entry point
    └── app/
        ├── app.config.ts            # Root application providers (Router, SSR, Firebase, i18n)
        ├── app.config.server.ts     # Server-specific providers (ServerRendering, Express)
        ├── app.routes.ts            # Route definitions & lazy-loaded component map
        ├── app.routes.server.ts     # Server prerender route manifests
        ├── core/                    # Infrastructure services, state singletons, utilities
        ├── content/                 # Typed bilingual content records & translation registry
        ├── pages/                   # Top-level page views (Home, Services, Case Studies, Contact)
        ├── sections/                # Page sections (Hero, Experience, Stack, Process, Testimonials)
        └── shared/                  # Reusable UI component library & layout primitives
```

---

## 2. Core Infrastructure Modules (`src/app/core/`)

| Directory             | Primary Responsibilities & Key Exports                                                                                                                                                                          |
| :-------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`core/routing/`**   | `route-manifest.ts`: Single source of truth for all application routes, metadata, canonical URLs, and sitemap priorities.<br>`active-path.ts`: Signals-driven active route resolver with query/hash normalizer. |
| **`core/i18n/`**      | Language detection, directionality switcher (`ltr` ↔ `rtl`), active locale signal, and fallback resolver.                                                                                                       |
| **`core/seo/`**       | Dynamic `<title>`, meta description, OpenGraph, Twitter Card, and canonical `<link>` injector; JSON-LD structured schema generator (`Service`, `Person`, `BreadcrumbList`).                                     |
| **`core/firebase/`**  | Firebase App initialization, Firestore injection token, App Check provider, and secure `submission.service.ts` for handling contact & wizard intake forms.                                                      |
| **`core/analytics/`** | Privacy-first telemetry abstraction (allows zero-tracking local development and pluggable analytics in production).                                                                                             |
| **`core/animation/`** | GSAP 3 animation orchestrator, scroll-triggered reveal hooks, and prefers-reduced-motion safety checks.                                                                                                         |
| **`core/platform/`**  | SSR platform guards (`isPlatformBrowser`, `isPlatformServer`) ensuring zero server-side window/DOM crash regressions.                                                                                           |

---

## 3. Content Architecture & Type System (`src/app/content/`)

The application avoids hardcoding text strings inside HTML templates. All text, pricing tiers, FAQs, case studies, and UI copy are maintained as **strictly-typed TypeScript content records**:

```text
src/app/content/
├── content.types.ts                 # Master interface definitions (ServicePageContent, FAQ, CTA, etc.)
├── content-registry.ts              # Central registry mapping routes to localized content bundles
├── arabic-plurals.ts                # 6-form Arabic grammatical pluralization engine
├── nav-links.content.ts             # Navigation menu structure & localized link labels
├── hero.content.ts                  # Homepage Hero headlines, badges, and trust metrics
├── services-hub.content.ts          # Services selector hub (/services) card copy
├── turnkey.content.ts               # Fixed-Price MVP page content (/services/fixed-mvp)
├── augmentation.content.ts          # Enterprise Augmentation page content (/services/enterprise-augmentation)
├── sprints.content.ts               # Hourly Sprints page content (/services/hourly-sprints)
├── audits.content.ts                # Tactical Audits page content (/services/tactical-audits)
├── case-studies.content.ts          # Case study summaries (Tashil, Drop-Delivery, Banking)
├── case-studies-detail.content.ts   # Deep architectural case study breakdowns
├── workflow.content.ts              # 4-stage engineering lifecycle documentation
├── policies.content.ts              # Privacy Policy, Terms of Service, 60-day Bug Warranty
└── ui-strings.content.ts            # Common UI labels (Buttons, forms, validation messages)
```

---

## 4. Public Route Mapping & Canonical URLs

All routes are registered in `route-manifest.ts` with bidirectional English and Arabic equivalents:

| Manifest Key   | English URL                         | Arabic URL                             | Purpose & Content                                                             |
| :------------- | :---------------------------------- | :------------------------------------- | :---------------------------------------------------------------------------- |
| `landing`      | `/`                                 | `/ar`                                  | Main portfolio landing page, hero, experience, stack, and offerings overview. |
| `services-hub` | `/services`                         | `/ar/services`                         | Service directory comparing the 4 engagement models.                          |
| `turnkey`      | `/services/fixed-mvp`               | `/ar/services/fixed-mvp`               | Turnkey Web App & MVP Engineering (Fixed price, 2–6 weeks, 40/30/30).         |
| `augmentation` | `/services/enterprise-augmentation` | `/ar/services/enterprise-augmentation` | Senior Angular contracting, Signals migration, enterprise teams.              |
| `sprints`      | `/services/hourly-sprints`          | `/ar/services/hourly-sprints`          | On-demand 10h/20h/40h engineering blocks & Figma-to-code.                     |
| `audits`       | `/services/tactical-audits`         | `/ar/services/tactical-audits`         | Emergency 24–48h bug diagnostics & performance profiling.                     |
| `blueprint`    | `/services/architecture-blueprint`  | `/ar/services/architecture-blueprint`  | Paid 1-week Technical Discovery Sprint & system specs.                        |
| `case-studies` | `/case-studies`                     | `/ar/case-studies`                     | Deep-dive portfolio work (Tashil SaaS, Drop-Delivery, Banking).               |
| `workflow`     | `/workflow`                         | `/ar/workflow`                         | 4-Stage engineering execution methodology.                                    |
| `policies`     | `/policies`                         | `/ar/policies`                         | 60-Day Warranty, Fair-Play Change Policy & Terms.                             |
| `contact`      | `/contact`                          | `/ar/contact`                          | Lead capture form & interactive project planner wizard.                       |

---

## 5. Reusable Shared Component Library (`src/app/shared/`)

- **`layout-container`:** Responsive grid and max-width wrapper ensuring consistent visual rhythm across viewports (`sm`, `md`, `lg`, `xl`, `2xl`).
- **`conversion-cta`:** High-conversion call-to-action blocks with dynamic primary/secondary action triggers and guarantee badges.
- **`package-table`:** Comparative pricing and deliverable matrix component supporting responsive mobile card collapse.
- **`faq-block`:** Semantic accordion FAQ component with accessible `aria-expanded` attributes and schema markup.
- **`language-switcher`:** Smooth locale toggle preserving the user's active route while switching between English (`/`) and Arabic (`/ar`).
- **`breadcrumb`:** Accessible navigational trail with dynamic JSON-LD `BreadcrumbList` schema generation.
- **`skip-link`:** WCAG 2.1 AA keyboard accessibility skip link for assistive technologies.

---

## 6. Build, Verification & Toolchain Commands

```bash
# Start local development server with hot module reload
npm run start          # Runs 'ng serve' on http://localhost:4200/

# Run complete pre-build validation and static build
npm run prebuild       # Executes build guards (placeholders, currencies) & generates sitemap
npm run build          # Compiles Angular SSR and generates prerendered static HTML

# Code quality & safety checks
npm run assert-no-any  # Enforces 100% strict TypeScript Zero-Any rule
npm run assert-build   # Asserts all route outputs are correctly generated in dist/
npm run test           # Executes unit tests via Vitest
npm run test:emulator  # Runs integration tests against local Firebase Firestore emulator
```
