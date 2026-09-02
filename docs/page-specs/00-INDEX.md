# Master Architecture & Page Directory Index

## 1. Executive Summary

This documentation suite captures **100% of the context, copy, data structures, commercial invariants, requirements, and interactive logic** across every page and component of the portfolio platform. It serves as the immutable reference source for redesigning all pages and components without losing domain knowledge, SEO rankings, localization support, or technical contracts.

---

## 2. Page & Route Map

| #   | Route Key      | Canonical Path (EN)                 | Canonical Path (AR)                    | Document Link                                                                    | Primary Purpose                                        |
| --- | -------------- | ----------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | `landing`      | `/`                                 | `/ar`                                  | [01-LANDING-PAGE.md](./01-LANDING-PAGE.md)                                       | High-converting homepage & portfolio showcase          |
| 2   | `services-hub` | `/services`                         | `/ar/services`                         | [02-SERVICES-HUB.md](./02-SERVICES-HUB.md)                                       | Service catalog selector hub & engagement chooser      |
| 3   | `turnkey`      | `/services/fixed-mvp`               | `/ar/services/fixed-mvp`               | [03-SERVICE-TURNKEY-MVP.md](./03-SERVICE-TURNKEY-MVP.md)                         | Fixed-price, end-to-end MVP development service        |
| 4   | `augmentation` | `/services/enterprise-augmentation` | `/ar/services/enterprise-augmentation` | [04-SERVICE-ENTERPRISE-AUGMENTATION.md](./04-SERVICE-ENTERPRISE-AUGMENTATION.md) | Enterprise engineering bandwidth & team augmentation   |
| 5   | `sprints`      | `/services/hourly-sprints`          | `/ar/services/hourly-sprints`          | [05-SERVICE-HOURLY-SPRINTS.md](./05-SERVICE-HOURLY-SPRINTS.md)                   | Flexible hourly sprint packages & maintenance          |
| 6   | `audits`       | `/services/tactical-audits`         | `/ar/services/tactical-audits`         | [06-SERVICE-TACTICAL-AUDITS.md](./06-SERVICE-TACTICAL-AUDITS.md)                 | Deep architectural, performance, and security audits   |
| 7   | `policies`     | `/policies`                         | `/ar/policies`                         | [07-POLICIES-PAGE.md](./07-POLICIES-PAGE.md)                                     | Warranties, scope change rules, and care plans         |
| 8   | `workflow`     | `/workflow`                         | `/ar/workflow`                         | [08-WORKFLOW-PAGE.md](./08-WORKFLOW-PAGE.md)                                     | 6-stage engineering and delivery methodology           |
| 9   | `case-studies` | `/case-studies`                     | `/ar/case-studies`                     | [09-CASE-STUDIES-PAGE.md](./09-CASE-STUDIES-PAGE.md)                             | Detailed case study portfolio and quantitative results |
| 10  | `contact`      | `/contact`                          | `/ar/contact`                          | [10-CONTACT-WIZARD-PAGE.md](./10-CONTACT-WIZARD-PAGE.md)                         | Interactive 4-step intake wizard & meeting booking     |
| 11  | `not-found`    | `/404` (catch-all)                  | `/ar/404`                              | [11-NOT-FOUND-PAGE.md](./11-NOT-FOUND-PAGE.md)                                   | 404 Error page & recovery routing                      |
| 12  | `admin`        | `/admin/*`                          | N/A (Internal)                         | [12-ADMIN-DASHBOARD.md](./12-ADMIN-DASHBOARD.md)                                 | Admin auth, submission pipeline & analytics            |
| 13  | `gallery`      | `/component-gallery`                | N/A (Internal)                         | [13-COMPONENT-GALLERY.md](./13-COMPONENT-GALLERY.md)                             | Design system & shared component catalog               |

---

## 3. Global Commercial Invariants

The platform adheres to strict, validated commercial invariants that must **never be altered or diluted**:

1. **Fixed-Price MVP Build**: Clear tier pricing starting at **$3,500** up to **$9,500**, turnaround in **2 to 6 weeks**, with 100% intellectual property handover upon completion.
2. **Hourly Sprints**: Packaged in **10-hour ($65/hr)**, **20-hour ($55/hr)**, and **40-hour ($45/hr)** blocks, with weekly asynchronous video updates and timesheets.
3. **Tactical Audits**: Fast turnaround within **3 to 7 business days**, priced from **$800** to **$2,800**, covering code quality, bundle size, security, and accessibility.
4. **Bug Warranty**: **30-Day post-launch warranty** included with all fixed-price projects covering defects in delivered scope at zero extra cost.
5. **White-Label & Agency Support**: Strict NDA compliance, direct Slack/GitLab integration, and white-label client representation.

---

## 4. Internationalization & Localization (i18n)

- **Locales Supported**: English (`en`, LTR default) and Arabic (`ar`, RTL).
- **RTL Infrastructure**:
  - `[lang="ar"]` automatically applies `dir="rtl"` and switches typography to **Cairo**.
  - All directional utilities use logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`).
  - Strict pluralization rules (`arabic-plurals.ts`) for 0 (zero), 1 (singular), 2 (dual), 3–10 (paucal/plural), 11–99 (accusative singular), 100+ (genitive singular).
- **SEO & Canonical Tags**:
  - Prerendered HTML includes `<link rel="alternate" hreflang="en" ...>` and `<link rel="alternate" hreflang="ar" ...>` on all static routes.
  - Social OpenGraph and Twitter cards configured per locale.

---

## 5. Design Tokens & Styling Architecture

- **Typography**:
  - **Satoshi** (`400`, `500`, `700`): Universal typography for headings, titles, body, navigation, numbers, dates, metrics, and inputs.
  - **Melodrama** (`400`, `700`): Reserved for pricing figures, rate cards, and tier costs.
  - **Cairo** (`400`, `600`): Arabic localization typography.
- **Theme**: Angular Material 3 (`@angular/material`) System Tokens mapped via Tailwind CSS `@theme`:
  - `--mat-sys-surface`: Primary page background.
  - `--mat-sys-on-surface`: Primary high-contrast text.
  - `--mat-sys-on-surface-variant`: Secondary/muted text.
  - `--mat-sys-surface-container`: Elevated card and container background.
  - `--mat-sys-outline-variant`: Hairline dividers and subtle borders.
  - `--mat-sys-primary`: Vibrant accent (Cyan/Teal tone 40).
  - `--mat-sys-secondary`: Blue accent.
  - `--mat-sys-tertiary`: Emerald/Green accent.
- **Motion & Accessibility**:
  - All animations respect `@media (prefers-reduced-motion: reduce)` with zero-delay transitions.
  - Strict heading hierarchy: single `<h1>` per page, sequential `<h2>` sections referenced via `aria-labelledby`, nested `<h3>` cards.
  - 44×44px minimum interactive touch target sizes.
