# Design System & Shared Components Specification

## 1. Overview & Architecture

- **Path**: `/component-gallery` (Excluded from public SEO indexing)
- **Component File**: `src/app/pages/component-gallery/component-gallery.ts`
- **Purpose**: Interactive design system showcase and regression sandbox validating Angular Material 3 components, Tailwind theme bridges, custom glass tokens, and responsive layout directives.

---

## 2. Core Design Tokens & CSS Variables

### 2.1 Surfaces & Hierarchy

- `--mat-sys-surface`: Primary app background.
- `--mat-sys-surface-container`: Elevated glass card background (`rgba(...)` or `color-mix`).
- `--mat-sys-outline-variant`: Hairline dividers and subtle container borders.
- `--blur-glass`: `12px` frosted glass backdrop filter blur (`backdrop-filter: blur(12px)`).

### 2.2 Typography Tokens

- `--font-sans`: `Satoshi, sans-serif` (Universal UI, headings, numbers, and body).
- `--font-pricing`: `Melodrama, serif` (Pricing and rate cards).
- `--font-sans-ar`: `Cairo, sans-serif` (Arabic locale typography).

### 2.3 Accent Tokens

- `--color-accent-cyan` (`--mat-sys-primary`): Primary brand action color.
- `--color-accent-blue` (`--mat-sys-secondary`): Secondary brand color.
- `--color-accent-emerald` (`--mat-sys-tertiary`): Success and availability badge accent.

---

## 3. Shared Components Catalogue

### 3.1 Layout & Navigation Components

1. **`<app-site-nav>`**:
   - Sticky frosted glass header with identity branding, responsive navigation links, CTA button, and interactive language switcher.
2. **`<app-breadcrumb>`**:
   - Structured JSON-LD BreadcrumbList with accessible `aria-label="Breadcrumb"` and trailing page item marked `aria-current="page"`.
3. **`<app-layout-container>` (Directive)**:
   - Sets fluid responsive padding: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`. Prose variant: `max-w-3xl mx-auto`.
4. **`<app-footer>`**:
   - Bottom legal, copyright, and external profile navigation links.
5. **`<app-skip-link>`**:
   - Keyboard accessibility jump to `#main-content`.

---

### 3.2 UI & Data Presentation Components

1. **`<app-package-table>`**:
   - Dynamic comparison table for service packages, milestones, and care plans. Supports tier names, commitments, suitability descriptions, and bulleted inclusion lists.
2. **`<app-faq-block>`**:
   - Accessible accordion / disclosure cards rendering FAQ questions (`<h3>`) and answers.
3. **`<app-conversion-cta-group>`**:
   - Dual-action conversion unit with primary booking button (opens Cal.com modal or navigates to `/contact`) and secondary contact button.
4. **`<app-booking-widget>`**:
   - Cal.com embed with responsive height, fallback notices, and error recovery.
5. **`<app-reveal>` (Directive)**:
   - Subtle scroll-driven micro-animation applying smooth opacity and translate-y transitions on viewport intersection.

---

### 3.3 Angular Material 3 Component Integrations

1. **`<mat-stepper>`**: Horizontal / vertical linear progress wizard for intake workflows.
2. **`<mat-form-field>`**: Floating label input containers with prefix/suffix icons and error messages.
3. **`<mat-radio-group>` & `<mat-radio-button>`**: Custom-styled radio option cards for goal/timeline/budget selection.
4. **`<mat-chip-set>` & `<mat-chip>`**: Tag badges with monospace font overrides.
5. **`<mat-accordion>` & `<mat-expansion-panel>`**: Expandable FAQ and documentation disclosures.
6. **`<table mat-table>`**: High-performance data table with sorting, pagination, and sticky headers.
