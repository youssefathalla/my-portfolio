# Workflow & Methodology Page (`/workflow`)

## 1. Page Overview

- **Route Key**: `workflow`
- **Canonical Paths**:
  - English: `/workflow`
  - Arabic: `/ar/workflow`
- **Component File**: `src/app/pages/workflow/workflow.ts` & `src/app/pages/workflow/workflow.html`
- **Purpose**: A clear, sequential 4-stage breakdown of how client engagements unfold from initial scoping to architecture, test-driven sprint execution, and final production handover.

---

## 2. SEO & Route Metadata

| Field                 | English (`en`)                                                                                                                                                | Arabic (`ar`)                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Page Title**        | `Engineering Workflow & Delivery &#124; Youssef Fathalla`                                                                                                     | `مراحل العمل والمنهجية الهندسية &#124; Youssef Fathalla`                                                                                |
| **Meta Description**  | `See how front-end engagements unfold: from discovery and architecture planning through test-driven sprint cycles to launch, handoff, and warranty coverage.` | `تعرف على مراحل تنفيذ المشاريع البرمجية: من الاستكشاف والتخطيط الهندسي مرورًا بدورات التطوير المختبرة وصولاً للإطلاق والتسليم والضمان.` |
| **Social Image**      | `/og/og-image.png`                                                                                                                                            | `/og/og-image.png`                                                                                                                      |
| **Robots Directives** | `index, follow`                                                                                                                                               | `index, follow`                                                                                                                         |

---

## 3. Visual & Section Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. Breadcrumb Navigation (`Home` > `Workflow`)              │
├─────────────────────────────────────────────────────────────┤
│ 2. Page Headline (`<h1>`)                                   │
├─────────────────────────────────────────────────────────────┤
│ 3. Ordered Workflow Stages (`<ol>` with 4 detailed cards)   │
│    - Stage 1: Discovery & Scoping                           │
│    - Stage 2: Design & Architecture                         │
│    - Stage 3: Build & Iterate                               │
│    - Stage 4: Launch & Handoff                              │
├─────────────────────────────────────────────────────────────┤
│ 4. Conversion CTA Group (Book Discovery Call + Contact)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Complete Content & Stage Breakdown

### 4.1 Page Headline (`<h1>`)

- **EN**: `How the Engagement Unfolds`
- **AR**: `كيف تسير مراحل العمل والتعاقد`

---

### 4.2 The 4 Delivery Stages (`<ol>`)

#### Stage 1: Discovery & Scoping (`<h3>`)

- **Summary**: `We talk through the problem you are solving, who it is for, and what "done" looks like. That conversation becomes a written scope, a rough architecture plan, and an engagement structure that fits the work.`
- **Client Input Needed**: `Bring your goal, any existing wireframes or brand materials, and access to the people who can answer questions about how the product should behave.`
- **Deliverables You Receive**: `You receive a written scope document, an architecture outline, and a proposed engagement structure to review and approve before any code is written.`

---

#### Stage 2: Design & Architecture (`<h3>`)

- **Summary**: `With scope agreed, the application takes shape on paper first: the data model, the component structure, and the integration points with any backend or third-party service are mapped out before implementation begins.`
- **Client Input Needed**: `Review the proposed data model and screen flow, and flag anything that does not match how your business actually operates.`
- **Deliverables You Receive**: `You receive a reviewable data model, a screen-flow outline, and sign-off on the technical approach before build work starts.`

---

#### Stage 3: Build & Iterate (`<h3>`)

- **Summary**: `Features are implemented against the agreed architecture, with automated tests written alongside the code they cover. Work lands in short, reviewable cycles rather than one long stretch with no visibility.`
- **Client Input Needed**: `Review each staged build as it becomes available and share feedback so the next cycle can incorporate it.`
- **Deliverables You Receive**: `You receive a working, tested build at the end of each cycle, deployed to a staging environment you can click through yourself.`

---

#### Stage 4: Launch & Handoff (`<h3>`)

- **Summary**: `Once the build passes review, it moves to production. Source code, repository access, and deployment credentials transfer to you, alongside a short walkthrough of how the application is put together.`
- **Client Input Needed**: `Confirm the production environment and any final content changes before go-live.`
- **Deliverables You Receive**: `You receive a deployed, production-ready application, full source code and repository ownership, and a walkthrough covering how to operate and extend it.`

---

### 4.3 Closing Conversion CTA Group

- **Primary CTA**: `Book a Discovery Call` (`حجز مكالمة استكشافية`) $\rightarrow$ `/contact`.
- **Secondary CTA**: `Ask About Your Project` (`استفسر عن مشروعك`) $\rightarrow$ `/contact`.
