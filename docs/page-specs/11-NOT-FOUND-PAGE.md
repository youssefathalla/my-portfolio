# 404 Not Found Page (`/404`)

## 1. Page Overview

- **Route Key**: `not-found`
- **Canonical Paths**: Catch-all wildcard `**` route (`/404` and `/ar/404`)
- **Component File**: `src/app/pages/not-found/not-found.ts` & `src/app/pages/not-found/not-found.html`
- **Purpose**: Clean, accessible error recovery view guiding users back to valid routes with zero broken links.

---

## 2. SEO & Route Metadata

| Field                 | English (`en`)                       | Arabic (`ar`)                           |
| --------------------- | ------------------------------------ | --------------------------------------- |
| **Page Title**        | `Page Not Found \| Youssef Fathalla` | `الصفحة غير موجودة \| Youssef Fathalla` |
| **Robots Directives** | `noindex, nofollow`                  | `noindex, nofollow`                     |

---

## 3. Visual Layout & Content Copy

- **Headline (`<h1>`)**:
  - EN: `Page Not Found | Youssef Fathalla`
  - AR: `الصفحة غير موجودة | Youssef Fathalla`
- **Primary Recovery Route Links**:
  1. `Back to Home` (`العودة إلى الرئيسية`) $\rightarrow$ `/` (or `/ar`)
  2. `Browse Services` (`استعراض الخدمات`) $\rightarrow$ `/services` (or `/ar/services`)

---

## 4. Technical Constraints

- Excluded from Breadcrumb navigation.
- Centered container layout (`appLayoutContainer="prose"`).
