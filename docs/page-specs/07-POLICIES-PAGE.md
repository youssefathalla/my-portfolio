# Policies, Guarantees & Care Plans Page (`/policies`)

## 1. Page Overview

- **Route Key**: `policies`
- **Canonical Paths**:
  - English: `/policies`
  - Arabic: `/ar/policies`
- **Component File**: `src/app/pages/policies/policies.ts` & `src/app/pages/policies/policies.html`
- **Purpose**: A comprehensive, legally sound, and transparent publication of all warranties, scope management rules, maintenance care plans, operational boundaries, and IP transfer terms.

---

## 2. SEO & Route Metadata

| Field                 | English (`en`)                                                                                                                                                       | Arabic (`ar`)                                                                                                                                |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Page Title**        | `Warranties, Scope & Care Policies &#124; Youssef Fathalla`                                                                                                          | `السياسات والضمانات وخطط الرعاية &#124; Youssef Fathalla`                                                                                    |
| **Meta Description**  | `Clear, published policies covering the 30-day bug warranty, the four-tier scope policy, ongoing care plans, operational rules, and source code ownership transfer.` | `سياسات واضحة ومنشورة تشمل ضمان الأخطاء لمدة 30 يومًا، سياسة نطاق العمل من أربعة مستويات، خطط الرعاية المستمرة، وقواعد نقل الملكية الفكرية.` |
| **Social Image**      | `/og/og-image.png`                                                                                                                                                   | `/og/og-image.png`                                                                                                                           |
| **Robots Directives** | `index, follow`                                                                                                                                                      | `index, follow`                                                                                                                              |

---

## 3. Visual & Section Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. Breadcrumb Navigation (`Home` > `Policies`)              │
├─────────────────────────────────────────────────────────────┤
│ 2. Page Headline (`<h1>`)                                   │
├─────────────────────────────────────────────────────────────┤
│ 3. 30-Day Bug Warranty Policy Block (`<h2>Warranty</h2>`)   │
├─────────────────────────────────────────────────────────────┤
│ 4. 4-Tier Scope Change Policy (`<h2>Scope Policy</h2>`)     │
├─────────────────────────────────────────────────────────────┤
│ 5. Ongoing Care Plans Comparison Table (`<h2>Care Plans</h2>│
├─────────────────────────────────────────────────────────────┤
│ 6. 5 Operational Rules (`<h2>Operational Rules</h2>`)       │
├─────────────────────────────────────────────────────────────┤
│ 7. Intellectual Property & Ownership Transfer Statement     │
├─────────────────────────────────────────────────────────────┤
│ 8. Policy Effective Date Statement                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Complete Content & Policy Breakdown

### 4.1 Page Headline (`<h1>`)

- **EN**: `Warranty, scope, and care-plan policies, published in one place`
- **AR**: `سياسات الضمان ونطاق العمل وخطط الرعاية، منشورة في مكان واحد`

---

### 4.2 Warranty Policy Block (`<h2>Warranty</h2>`)

- **Statement**: `Every fixed-price build includes a 30-day warranty, starting at production launch, covering any bug where the delivered application does not match the accepted requirements. New feature requests made after launch are not covered by this warranty and are quoted separately.`
- **Arabic**: `يتضمن كل مشروع بسعر ثابت فترة ضمان مدتها 30 يوماً، تبدأ من تاريخ الإطلاق للإنتاج، وتغطي أي خلل برمجي لا يتطابق فيه التطبيق المسلم مع المتطلبات المتفق عليها. الميزات الجديدة المطلوبة بعد الإطلاق لا يغطيها هذا الضمان وتُسعر بشكل منفصل.`

---

### 4.3 Scope Change Policy Tiers (`<h2>Scope Policy</h2>`)

1. **Tier 1: Requirement Phase (`<h3>`)**:
   - EN: `While requirements and wireframes are still being defined, scope changes are free. Nothing is locked in, and nothing is billed as a change, until development starts on a given feature.`
   - AR: `أثناء تحديد المتطلبات والمخططات الهيكلية (Wireframes)، تكون تغييرات النطاق مجانية بالكامل. لا شيء يُلزم أو يُحتسب كتغيير حتى يبدأ التطوير الفعلي للميزة المعنية.`
2. **Tier 2: Unbuilt Features (`<h3>`)**:
   - EN: `A feature that is planned but not yet built can still be changed, reordered, or dropped at no extra cost, as long as development has not started on it yet.`
   - AR: `أي ميزة مخططة لم يبدأ تطويرها بعد يمكن تعديلها أو إعادة ترتيب أولوياتها أو إلغاؤها دون أي تكلفة إضافية، طالما لم يبدأ العمل البرمجي عليها.`
3. **Tier 3: Built and Accepted Features (`<h3>`)**:
   - EN: `Once a feature is built and accepted, a request to change how it behaves is treated as new scope. It is estimated and scheduled like any other new piece of work, not folded into the original budget.`
   - AR: `بمجرد تطوير الميزة والموافقة عليها، يُعامل أي طلب لتغيير سلوكها كنطاق عمل جديد، حيث يُقدر ويُجدول كعمل مستقل ولا يُدرج ضمن الميزانية الأصلية.`
4. **Tier 4: New Feature Requests (`<h3>`)**:
   - EN: `A request for a feature outside the originally agreed scope is quoted separately as a mini-sprint, with its own timeline, its own deliverables, and its own sign-off, so the original engagement is never quietly stretched.`
   - AR: `تُسعر طلبات الميزات الخارجة عن النطاق المتفق عليه مبدئيًا كدورة تطوير مصغرة (Mini-Sprint) بجدول زمني ومخرجات واعتماد مستقل.`

---

### 4.4 Care Plans Comparison Table (`<h2>Care Plans</h2>`)

| Plan Tier          | Commitment & Hours              | Best For                                                 | What's Included                                                                                                 |
| ------------------ | ------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Essential Care** | 3-month plan, 2 hours / month   | Stable application needing monitoring & periodic patches | Support response within 48 hours, monthly dependency/security updates, uptime & error monitoring                |
| **Standard Care**  | 6-month plan, 5 hours / month   | Active app shipping regular small enhancements           | Support response within 24 hours, monthly updates, uptime monitoring, 5h/mo dedicated feature capacity          |
| **Premium Care**   | 12-month plan, 10 hours / month | Business-critical application needing fast priority SLA  | Priority response within 12 hours, monthly updates, uptime monitoring, 10h/mo feature work, priority scheduling |

---

### 4.5 The 5 Operational Rules (`<h2>Operational Rules</h2>`)

1. **Inactivity Pause (`<h3>`)**:
   - If a project goes **30 days or more** without client input or feedback, the engagement is paused. Resuming requires a written re-boarding notice of **5 business days** for rescheduling.
2. **Intellectual Property Transfer Gate (`<h3>`)**:
   - Source code, repository access, and production deployment credentials remain developer property until final milestone payment clears. Full ownership transfers immediately upon clearance.
3. **Communication Standard (`<h3>`)**:
   - All project communication runs through a single agreed channel (Email, Slack, or Project Management tool) to eliminate lost threads.
4. **Working Hours and Out-of-Hours Rate (`<h3>`)**:
   - Standard hours: **Sunday - Thursday**, **09:00 - 18:00 (UTC+2)**. Work requested outside these hours is billed at **1.5x** standard rate.
5. **AI Privacy Isolation Guarantee (`<h3>`)**:
   - AI assistants run with local context boundaries only; client code is strictly quarantined and **never** shared with public model training datasets.

---

### 4.6 Legal Statements

- **Ownership Transfer**: `Source code ownership, repository transfer, and production deployment access all transfer to the client on receipt of the final payment. Before that milestone, the developer retains ownership of all deliverables.`
- **Effective Date**: `Published and effective as of August 2026.`
