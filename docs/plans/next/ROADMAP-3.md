# Portfolio Site — Phase 3 Roadmap & Outstanding Tasks

Consolidated backlog of all remaining features, UI improvements, platform extensions, and distribution tasks.

---

## 1. Navigation Redesign (Categories & Sub-Categories)

### Goal

Restructure the public navigation from a flat link list into a **hierarchical menu** with category dropdowns, sub-categories, and an explicit Home link.

### Proposed Desktop / Mobile Menu Hierarchy

```text
[Home]  [Services ▾]  [Work ▾]  [About ▾]  [Contact]

Services (category)
├── Fixed-Price MVP Build (/services/fixed-mvp)
├── Enterprise Augmentation (/services/enterprise-augmentation)
├── Hourly Sprints (/services/hourly-sprints)
└── Tactical Audits (/services/tactical-audits)

Work (category)
├── Case Studies (/case-studies)
└── Workflow (/workflow)

About (category)
├── Tech Stack (#stack)
├── Experience / Timeline (#experience)
└── Policies (/policies)
```

### Action Items

- [ ] Make `Home` a visible navigation item across all viewports.
- [ ] Define category hierarchy in `src/app/core/routing/route-manifest.ts` or a dedicated `nav-categories.ts`.
- [ ] Build a **desktop dropdown/mega-menu** component (with smooth GSAP or CSS transition and hover/focus triggers).
- [ ] Update mobile drawer menu to use **accordion / expandable collapsible sections** for categories.
- [ ] Implement full accessibility: `aria-expanded`, `aria-haspopup`, arrow-key navigation, and `Escape` to close.
- [ ] Ensure full bidirectional RTL/LTR support for Arabic (`/ar/*`) and English (`/*`).

---

## 2. UI Polish & Experience Enhancements

### Goal

Refine visual polish, micro-interactions, theme customization, and page transitions.

### Action Items

- [ ] **Hero Section Enhancement:** Bolder typography treatment, dynamic ambient particle or animated gradient background.
- [ ] **Page Transitions:** Route change fade/slide animations for smoother page navigation.
- [ ] **Skeleton Loaders:** Add animated skeleton placeholder states for lazy-loaded routes and assets.
- [ ] **Dark / Light Mode Toggle:** Add a theme switcher with persisted preference (or further refine the obsidian glassmorphism palette).
- [ ] **Custom 404 Page:** Redesign the not-found view with interactive navigation cues and search/return links.
- [ ] **Component Library Extensions:** Add accordions, tabs, and rich card components where applicable.

---

## 3. Platform & Content Extensions (Future Features)

### Goal

Expand portfolio authority, proof of work, and inbound lead conversion.

### Action Items

- [ ] **Blog / Technical Articles Section:** Markdown or Firestore-backed articles with code syntax highlighting and tags.
- [ ] **Testimonials Section:** Verified client quotes, company logos, and project outcome highlights.
- [ ] **Filterable Project Gallery:** Visual case studies filterable by tech stack (Signals, Firebase, Tailwind, SSR).
- [ ] **Live Analytics Dashboard:** Client-side privacy-friendly telemetry dashboard (replacing Noop adapter).
- [ ] **Client Portal:** Secure client login area to track contract milestones, invoices, and bug warranty status.

---

## 4. Post-Launch QA & External Verification

### Goal

Execute external manual production verification and search indexation.

### Action Items

- [ ] **Google Search Console:** Submit `https://youssefathalla.com/sitemap.xml` and request indexing for English and Arabic routes.
- [ ] **Social Card Previews:** Verify OpenGraph and Twitter cards in [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) and Twitter Card Validator.
- [ ] **Production Lighthouse Audit:** Run live performance audit against production URL (target: 95+ Performance, 100 Accessibility).

---

## 5. Profile Distribution & Outreach Execution

### Action Items

- [ ] **LinkedIn Headline:** Update to _"Senior Angular Architecture Specialist & Full-Stack Firebase Engineer"_.
- [ ] **LinkedIn Featured Links:**
  - Enterprise CTOs / Tech Leads: `https://youssefathalla.com/services/enterprise-augmentation`
  - Startup Founders: `https://youssefathalla.com/services/fixed-mvp`
- [ ] **GitHub & Community Bios:** Update bio with `https://youssefathalla.com/` and confirm master CV link (`contractor-cv.pdf`).
- [ ] **Outreach & Authority Building:**
  - Create free lead magnet (e.g., _Angular v22 Enterprise Steering Template_).
  - Draft technical micro-articles on Signals refactoring and AI-assisted engineering workflows.
