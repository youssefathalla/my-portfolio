# Landing / Portfolio Page (`/` and `/ar`)

## 1. Page Overview

- **Route Key**: `landing`
- **Canonical Paths**:
  - English: `/`
  - Arabic: `/ar`
- **Component File**: `src/app/pages/home/home.ts` & `src/app/pages/home/home.html`
- **Layout Model**: Single-page portfolio application with smooth anchor scrolling (`scroll-behavior: smooth`) and accessible keyboard skip links.

---

## 2. SEO & Route Metadata

| Field                 | English (`en`)                                                                                                                                                   | Arabic (`ar`)                                                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Page Title**        | `Youssef Fathalla \| Senior Front-End Engineer`                                                                                                                  | `Youssef Fathalla \| مهندس واجهات أمامية أول`                                                                                                               |
| **Meta Description**  | `Senior Front-End Specialist offering contract web app development and white-label agency engineering in Angular, TypeScript, and modern reactive architecture.` | `مهندس واجهات أمامية أول يقدم خدمات تطوير تطبيقات الويب بالتعاقد والعمل البرمجي للوكالات باستخدام Angular وTypeScript وأحدث بنى البرمجة التفاعلية الحديثة.` |
| **Social Image**      | `/og/og-image.png` (1200×630px)                                                                                                                                  | `/og/og-image.png` (1200×630px)                                                                                                                             |
| **Robots Directives** | `index, follow`                                                                                                                                                  | `index, follow`                                                                                                                                             |

---

## 3. Visual & Section Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. Site Navigation (Sticky Glass Bar + Mobile Drawer)       │
├─────────────────────────────────────────────────────────────┤
│ 2. Hero Section (Availability + Portrait + Value Prop + CTA)│
├─────────────────────────────────────────────────────────────┤
│ 3. Engineering Standards / Trust Bar (4 Core Metrics)       │
├─────────────────────────────────────────────────────────────┤
│ 4. Featured Case Studies (Interactive Showcase + Link)      │
├─────────────────────────────────────────────────────────────┤
│ 5. Technical Stack (5 Distinct Skill Groups)                │
├─────────────────────────────────────────────────────────────┤
│ 6. Experience Timeline (Enterprise & Freelance Tracks)      │
├─────────────────────────────────────────────────────────────┤
│ 7. Agency / White-Label Front-End Partner (3 Pillars)       │
├─────────────────────────────────────────────────────────────┤
│ 8. Contact & Discovery (Form + Cal.com Widget + CV)         │
├─────────────────────────────────────────────────────────────┤
│ 9. Footer (Identity + Copyright + Legal Links)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Detailed Section Breakdown & Complete Copy

### 4.1 Header / Site Navigation (`<app-site-nav>`)

- **Identity Label**: `Youssef Fathalla`
- **Navigation Links**:
  1. `Services` (`/services` / `/ar/services`)
  2. `Case Studies` (`/case-studies` / `/ar/case-studies`)
  3. `Workflow` (`/workflow` / `/ar/workflow`)
  4. `Policies` (`/policies` / `/ar/policies`)
  5. `Contact` (`/contact` / `/ar/contact`)
- **Action Control**: `Book a Call` $\rightarrow$ triggers smooth scroll to `#contact` or opens `/contact`.
- **Locale Switcher**: Toggles between `EN` and `العربية` with full route mirroring.

---

### 4.2 Hero Section (`<app-hero>`)

- **Availability Badge**:
  - EN: `Available for Contract & Agency Work`
  - AR: `متاح للتعاقد والعمل مع الوكالات`
- **Headline (`<h1>`)**:
  - EN: `Senior Front-End Engineer & Web Application Specialist`
  - AR: `مهندس واجهات أمامية أول ومتخصص في تطوير تطبيقات الويب`
- **Subheadline**:
  - EN: `Building fast, scalable, and reactive web applications. I turn complex Figma designs, enterprise backlogs, and legacy codebases into production-ready front-end architecture.`
  - AR: `بناء تطبيقات ويب سريعة، قابلة للتوسع، وتفاعلية بالكامل. أقوم بتحويل تصاميم Figma المعقدة، ومهام المؤسسات المتراكمة، والأنظمة القديمة إلى بنية برمجية جاهزة للإنتاج.`
- **Call-to-Action Controls**:
  - **Primary CTA**: `Book a Discovery Call` (`حجز مكالمة استكشافية`) $\rightarrow$ scrolls to `#contact`.
  - **Secondary CTA**: `Explore Case Studies` (`استعراض دراسات الحالة`) $\rightarrow$ scrolls to `#case-studies`.
- **Portrait Asset**: `/images/portrait.png` (585×795px), `alt="Portrait of Youssef Fathalla, Senior Front-End Engineer"`.

---

### 4.3 Engineering Standards / Trust Bar (`<app-trust-bar>`)

- **Section Heading (`<h2>`)**: `Engineering Standards` (`معايير الهندسة البرمجية`)
- **4 Quantitative Cards**:
  1. **Stack**:
     - Label: `Stack` (`التقنيات`)
     - Value: `Modern Angular (v16-v21+)` (`Angular الحديث (v16-v21+)`)
  2. **Performance**:
     - Label: `Perf` (`الأداء`)
     - Value: `100/100 Performance & Accessibility` (`100/100 في الأداء وسهولة الوصول`)
  3. **Architecture**:
     - Label: `Arch` (`البنية`)
     - Value: `SignalStore & Reactive Architecture` (`SignalStore والبنية التفاعلية`)
  4. **Work Model**:
     - Label: `Model` (`النموذج`)
     - Value: `100% White-Label & NDA Compliant` (`100% تطوير خاص (White-Label) والتزام بالسرية`)

---

### 4.4 Featured Case Studies (`<app-case-studies>`)

- **Section Heading (`<h2>`)**: `Featured Case Studies` (`دراسات حالة مختارة`)
- **Directory Link**: `View All Case Studies` (`عرض جميع دراسات الحالة`) $\rightarrow$ `/case-studies`.
- **Featured Projects**:
  1. **Multi-Tenant SaaS Platform (Tashil)**:
     - Problem: `Needed a high-performance multi-tenant dashboard with complex role-based access control (RBAC), multi-language support (i18n), and dynamic data table handling.`
     - Solution: `Architected modular standalone components utilizing Angular Signals, RxJS, and Firebase Cloud Firestore for real-time data sync.`
     - Metric: `40% smaller payload, faster render`
  2. **Enterprise Banking System Refactor**:
     - Problem: `A Tier-1 financial institution in the GCC region needed its legacy monolithic banking UI modernized into secure, accessible, high-performance modular components for core financial workflows.`
     - Solution: `Refactored public and private section views into modern Angular standalone architecture with strict WCAG accessibility compliance, working within enterprise-grade security and compliance constraints.`
     - Metric: `100% WCAG accessible, zero-latency UI`
  3. **Logistics & E-Commerce POS System**:
     - Problem: `High-frequency state synchronization and dynamic client-side workflows were causing UI lags in real-time order processing.`
     - Solution: `Engineered reactive state pipelines with SignalStore to handle live order tracking and seamless API integration.`
     - Metric: `Real-time sync across multi-user UI`

---

### 4.5 Technical Stack (`<app-stack>`)

- **Section Heading (`<h2>`)**: `Technical Stack` (`التقنيات وحلول البناء`)
- **5 Technology Groups (`<h3>`)**:
  1. **Core & Frameworks**: `Angular (v16-v21+)`, `TypeScript`, `Signals`, `RxJS`
  2. **State & Architecture**: `NgRx / SignalStore`, `Standalone Architecture`, `Clean Architecture`
  3. **Backend & Integrations**: `Firebase`, `Cloud Firestore`, `Role-Based Access Control (RBAC)`, `REST APIs`
  4. **Quality & Testing**: `Vitest`, `Unit & Integration Testing`, `Web Performance`, `Accessibility (a11y)`
  5. **Styling & UI**: `Tailwind CSS`, `Custom Design Systems`, `Angular Material`

---

### 4.6 Experience Timeline (`<app-timeline>`)

- **Section Heading (`<h2>`)**: `Experience & Track Record` (`الخبرات المهنية وسجل الأعمال`)
- **Tracks (`<h3>`)**:
  - **Track A: Enterprise & Corporate**:
    1. `Front-End Developer` at `eSpace — Financial Services Client Engagement` (`Jan 2026 - Present`):
       - Summary: `Delivering front-end engineering for Tier-1 financial institutions in the GCC region through eSpace, working within enterprise-grade security and compliance constraints on core banking platform interfaces and enterprise GitLab workflows.`
    2. `Front-End Developer` at `Retail Point of Sale (POS) Platform` (`Oct 2024 - Dec 2024`):
       - Summary: `Built a real-time POS interface on ASP.NET and Angular handling cashier sessions, sales processing, and inventory updates, including complex Angular Material data tables for efficient sorting and filtering of large datasets.`
  - **Track B: Freelance & Contract Projects**:
    1. `Full Stack Developer` at `Switch Point — Tashil (Enterprise Multi-Tenant SaaS Platform)` (`Aug 2025 - Present`):
       - Summary: `Architected a multi-tenant SaaS platform with segregated Super Admin and HR Manager dashboards, strict data isolation, and Role-Based Access Control (RBAC). Integrated Angular Signals and Firebase Cloud Firestore.`
    2. `Front-End Developer` at `Corporate Logistics Platform` (`May 2025 - Jul 2025`):
       - Summary: `Designed responsive corporate client portal with Angular Material, dynamic multi-language localization (EN/AR), and automated client-side invoice generation.`

---

### 4.7 Agency / White-Label Front-End Partner (`<app-agency>`)

- **Section Heading (`<h2>`)**: `White-Label Front-End Partner` (`شريك هندسة الواجهات الأمامية للوكالات`)
- **Pitch**: `Got Figma designs ready to build, or an enterprise project backlog piling up? I act as your invisible front-end engineering partner under your brand and strict NDA.`
- **3 Value Pillars (`<h3>`)**:
  1. `100% White-Label & NDA Compliant`: `I work under your agency brand inside your communication tools. Zero direct client contact.`
  2. `Production-Ready Delivery`: `Fully responsive, accessible, and unit-tested with Vitest — clean code your in-house team can easily maintain.`
  3. `Flexible Working Models`: `Available on a fixed project quote, weekly retainer, or overflow hourly capacity.`

---

### 4.8 Contact Section (`<app-contact>`)

- **Section Heading (`<h2>`)**: `Contact` (`تواصل معي`)
- **Direct Email**: `youssefathalla@gmail.com`
- **Contact Controls**:
  - `Copy Email` (`نسخ البريد الإلكتروني`) $\rightarrow$ copies to clipboard and shows `Copied!` for 2000ms.
  - `Download CV (PDF)` (`تحميل السيرة الذاتية`) $\rightarrow$ downloads `/cv/contractor-cv.pdf`.
  - Quick message submission form with inline validation.
  - Interactive Cal.com scheduling embed / booking widget.

---

## 5. Technical Requirements & Accessibility

- **Skip Link**: `<app-skip-link>` jumps directly to `#main-content`.
- **Heading Outline**: Single `h1` in Hero $\rightarrow$ `h2` in every section wrapped in `<section aria-labelledby="...">` $\rightarrow$ `h3` for cards and timeline roles.
- **Form Submission Contract**: Submissions posted to Firestore `submissions` collection or configured endpoint with CSRF and validation.
