# Portfolio Site — Roadmap & Next Steps

## Current State (as of August 2026)

- Angular 22 SSR app with Express server
- Deployed via **Firebase App Hosting**
- Styling: Tailwind CSS v4 + custom SCSS, dark glassmorphic theme
- UI component library: Angular Material v22 with custom token bridge
- Backend services: Firebase (Firestore, Auth, Cloud Functions), Cal.com (booking embeds)
- Navigation: Multilingual (English / Arabic RTL) route manifest

---

## Phase 1 — Firebase as the Backend

### Goal

Replace Formspree with Firebase services and use Firebase as the real backend for data, auth (if needed), and server-side logic.

### Tasks

- [x] Install Firebase SDK (`firebase`)
- [x] Create `firebase.json` and `.firebaserc` config for App Hosting + Firestore
- [x] Add Firebase project config (apiKey, projectId, etc.) to `environment.ts`
- [x] Register `provideFirebaseApp()` and relevant providers in `app.config.ts`
- [x] **Firestore** — store contact form & intake wizard submissions in a `submissions` collection
- [x] **Cloud Functions** — email notification on new submission, rate limiting, spam filtering
- [x] **Firebase Auth** — admin dashboard login to view submissions
- [x] Replace `FormSubmissionService` to write to Firestore instead of Formspree
- [x] Add Firestore security rules (`firestore.rules`)
- [x] Keep App Hosting deployment as-is (already working)

---

## Phase 2 — UI Library Integration

### Goal

Adopt a component library to speed up development, get consistent UI patterns, and improve polish.

### Tasks

- [x] Pick library (Angular Material selected and installed at `@22.1.2`)
- [x] Install and configure theming to match existing dark palette (obsidian, accent-cyan, accent-blue, accent-emerald)
- [x] Migrate existing hand-built components to library equivalents where it makes sense (buttons, dialogs, form inputs, tooltips, snackbars, chips)
- [ ] Add new components: dropdown menus, mega-menu nav, accordions, tabs, cards, skeletons/loaders

---

## Phase 3 — Navigation Redesign (Categories & Sub-Categories)

### Goal

Restructure the navigation from a flat link list to a **hierarchical menu** with categories, sub-categories, and a Home link.

### Proposed Structure

```text
[Home]  [Services ▾]  [Work ▾]  [About ▾]  [Contact]

Services (category)
├── Fixed-Price MVP Build
├── Enterprise Augmentation
├── Hourly Sprints
└── Tactical Audits

Work (category)
├── Case Studies
└── Workflow

About (category)
├── Tech Stack
├── Experience / Timeline
└── Policies
```

### Tasks

- [ ] Add `Home` as a visible nav item (currently `navPlacement: 'hidden'`)
- [ ] Define category groups in the route manifest or a new `nav-categories.ts` config
- [ ] Build a **dropdown/mega-menu** component for desktop (hover/click to expand sub-items)
- [ ] Update mobile menu to use **accordion/expandable** sections for categories
- [ ] Wire `aria-expanded`, `aria-haspopup`, keyboard navigation (arrow keys, Escape to close)
- [ ] Keep the emerald "Available for Contract Work" CTA on the right
- [ ] Animate open/close with GSAP or CSS transitions

---

## Phase 4 — UI Improvements & Polish

### Goal

Improve the overall visual quality, consistency, and interactivity.

### Tasks

- [ ] Refine hero section — bolder typography, animated gradient or particle background
- [ ] Add page transition animations (route change fade/slide)
- [x] Improve form inputs — floating labels, validation states, better focus rings (MatFormField / MatInput)
- [ ] Add skeleton loading states for lazy-loaded pages
- [x] Improve mobile responsiveness — test all breakpoints, refine spacing
- [ ] Add dark/light mode toggle (or just polish the dark mode further)
- [x] Micro-interactions — button hover effects, card hover lifts, scroll-reveal animations
- [ ] Improve the 404 page with a more engaging design
- [x] Add toast/snackbar notifications for form submission feedback (MatSnackBar)
- [x] Improve accessibility — focus management, ARIA live regions for dynamic content

---

## Phase 5 — Admin Dashboard (Client Requests & Data)

### Goal

A protected admin area where you can view, manage, and respond to all client submissions — contact forms, intake wizard responses, and any future inbound data. Firebase Auth gates access; Firestore is the data layer.

### Auth & Access

- [x] Firebase Auth with email/password (just you — single admin user)
- [x] Auth guard on `/admin` routes — redirect to login if unauthenticated
- [x] Firestore security rules: only authenticated admin UID can read/write submissions
- [x] Login page (simple email + password form, no registration)

### Dashboard Pages

- [x] `/admin` → Dashboard overview (stats, recent submissions)
- [x] `/admin/submissions` → Full list with filters & search
- [x] `/admin/submissions/:id` → Detail view of one submission

### Dashboard Features

- [x] **Overview cards** — total submissions, new (unread), in-progress, this week count
- [x] **Submissions table** — sortable by date, filterable by type/status/tags, searchable
- [x] **Status workflow** — mark as read, move to in-progress, archive, flag as spam
- [x] **Detail view** — full payload display, internal notes field, status change, tag management
- [x] **Real-time updates** — Firestore `onSnapshot` listeners (new submissions appear live)
- [x] **Notifications** — Cloud Function sends email/push on new submission
- [x] **Bulk actions** — select multiple, archive all, mark all read
- [x] **Export** — download submissions as CSV/JSON

### Technical Tasks

- [x] Create `/admin` route group (lazy-loaded, separate from public site)
- [x] Implement `AuthService` wrapping Firebase Auth (login, logout, auth state)
- [x] Implement `AuthGuard` (canActivate) for admin routes
- [x] Create login page component
- [x] Create dashboard layout shell (sidebar nav, header with logout)
- [x] Build overview/stats page (aggregate queries on submissions collection)
- [x] Build submissions list component (paginated Firestore query, filters)
- [x] Build submission detail component (read single doc, update status/notes)
- [x] Build real-time listener service for live submission feed
- [x] Style dashboard using chosen UI library components (tables, cards, badges, dialogs)
- [x] Write Firestore security rules restricting admin access to your UID
- [x] Cloud Function: on new submission → send notification email

---

## Phase 6 — Content & Features (Future)

- [ ] Blog/articles section (Firestore or markdown-based)
- [ ] Testimonials section with real client quotes
- [ ] Project gallery with filtering
- [ ] Analytics dashboard (beyond the current NoopAnalyticsAdapter)
- [x] i18n (Arabic + English)
- [ ] Client portal (clients log in to see their project status — future)
