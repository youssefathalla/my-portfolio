# Service Page: Tactical Audits (`/services/tactical-audits`)

## 1. Page Overview

- **Route Key**: `audits`
- **Canonical Paths**:
  - English: `/services/tactical-audits`
  - Arabic: `/ar/services/tactical-audits`
- **Component File**: `src/app/pages/service/audits-page/audits-page.ts` (using shared `ServicePageTemplate`)
- **Core Value Proposition**: Rapid, senior-level diagnostic audits and isolated branch code fixes for urgent production defects, memory leaks, accessibility violations, and web performance bottlenecks.

---

## 2. SEO & Route Metadata

| Field                 | English (`en`)                                                                                                                                                     | Arabic (`ar`)                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Page Title**        | `Tactical Production Audits & Fixes \| Youssef Fathalla`                                                                                                           | `التدقيق الفني التكتيكي وإصلاح الأعطال \| Youssef Fathalla`                                                                         |
| **Meta Description**  | `Fast root-cause diagnosis and code fixes for production defects, memory leaks, and performance bottlenecks delivered on an isolated branch with automated tests.` | `تشخيص فوري وإصلاح للأعطال الحرجة في بيئة الإنتاج ومشكلات تسريب الذاكرة وبطء الأداء مع تسليم الحل في فرع معزول مع اختبارات مؤتمتة.` |
| **Social Image**      | `/og/og-image.png`                                                                                                                                                 | `/og/og-image.png`                                                                                                                  |
| **Robots Directives** | `index, follow`                                                                                                                                                    | `index, follow`                                                                                                                     |

---

## 3. Response SLAs & Commercial Invariants

- **Emergency Enquiry SLA**: Acknowledged within **4 hours** during working hours (**Sunday - Thursday**, **09:00 - 18:00 Egypt Standard Time UTC+2**).
- **Rapid Resolution Window**: Typical defect resolution and fix delivery in **24 to 48 hours**.
- **Audit Delivery Windows**:
  - **Quick Scan / Hotfix**: **2 to 3 business days**.
  - **Deep Performance & Memory Audit**: **3 to 4 business days**.
  - **Complete Architecture & Modernization Review**: **4 to 5 business days**.
- **Delivery Safety Rule**: Every code change is submitted via an **isolated git branch** with unit tests; never pushed directly to your production or main branch.

---

## 4. Complete Content & Copy Breakdown

### 4.1 Header & Hero

- **Audience Tag**: `Application owners facing performance problems or production defects` (`لأصحاب التطبيقات الذين يواجهون مشكلات أداء أو أعطالاً طارئة`)
- **Headline (`<h1>`)**: `Fast, isolated fixes for production defects and performance problems` (`إصلاحات سريعة ومعزولة لأعطال بيئة الإنتاج ومشكلات الأداء`)
- **Subheadline**: `A focused audit that diagnoses the defect or bottleneck, delivers the fix on an isolated branch for your review, and hands you before-and-after measurements plus a clear modernization plan, so you can decide in one reading whether to send the request.`
- **Trust Highlights (3 Badges)**:
  1. `Fast Acknowledgement`: `Acknowledged within 4 hours, Sunday-Thursday, 9:00 AM-6:00 PM (UTC+2)`
  2. `Rapid Resolution`: `Typical resolution in 24-48 hours, Sunday-Thursday, 9:00 AM-6:00 PM (UTC+2)`
  3. `Senior-Level Diagnosis`: `Root-cause diagnosis from a senior engineer, not a junior triage checklist.`
- **Primary CTA**: `Book an Urgent Call` (`حجز مكالمة طارئة`) $\rightarrow$ books 15-minute urgent alignment call & `Send Details by Email` (`إرسال التفاصيل عبر البريد`).

---

### 4.2 Capability Blocks (`<h2>Capabilities</h2>`)

1. **Emergency Defect Resolution (`<h3>`)**:
   - Triage production defects that are blocking users or breaking checkout, auth, or other core flows.
   - Every patch and performance fix ships with automated tests covering the resolved defect.
   - Rapid reproduction of the failure against your production environment, data shapes, and browser matrix.

2. **Performance and Memory Diagnosis (`<h3>`)**:
   - Profile render performance, bundle size, and network waterfalls to find the actual bottleneck.
   - Track down memory leaks, detached DOM nodes, and runaway RxJS subscriptions causing slowdowns or crashes.
   - Benchmark before-and-after Core Web Vitals so improvement is quantitatively verified.

3. **Legacy Modernisation Planning (`<h3>`)**:
   - Assess an ageing codebase for upgrade paths, dead dependencies, and security exposure.
   - Prioritize a modernization roadmap by risk and effort, so budget goes to the changes that matter first.
   - Recommend a phased migration strategy that avoids a risky, all-at-once rewrite.

---

### 4.3 Methodology & 3-Stage Delivery Process (`<h2>Our Audit Methodology</h2>`)

1. **Stage 1: Diagnosis (`<h3>`)**: Reproduce the defect or profile the performance bottleneck against your production environment and real data patterns.
2. **Stage 2: Isolated Fix (`<h3>`)**: Implement the fix or optimization on a dedicated branch, backed by automated tests covering the resolved defect.
3. **Stage 3: Verification & Handoff (`<h3>`)**: Validate the fix against your acceptance criteria and hand off measurements plus a written root-cause summary.

---

### 4.4 The 5 Tangible Deliverables (`<h2>What You Receive</h2>`)

1. **Written Root-Cause Summary**: Comprehensive document explaining what failed, why it failed, and how it was fixed.
2. **Isolated Branch Pull Request**: Complete code changes submitted on a dedicated branch with zero risk to main.
3. **Before-and-After Measurements**: Lighthouse / Chrome DevTools profiler metrics verifying performance gains.
4. **Maintenance Recommendations**: Proactive report flagging future modernization risks and dependency deprecations.
5. **Automated Regression Test Suite**: Automated tests verifying the fix to prevent regression.

---

### 4.5 Audit Package Options Table

| Package Tier                            | Delivery Window   | Best For                                                          | What's Included                                                                                     |
| --------------------------------------- | ----------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Defect Triage & Hotfix**              | 2-3 business days | An urgent production bug blocking users or revenue                | Root-cause diagnosis, isolated branch fix, regression unit tests, verification summary              |
| **Performance & Memory Audit**          | 3-4 business days | Sluggish UI, high memory consumption, poor Core Web Vitals        | DevTools profiling report, memory leak patch, bundle optimization, before-after metrics             |
| **Full Architecture & Security Review** | 4-5 business days | Codebases preparing for scaling, major upgrades, or due diligence | Dependency vulnerability check, clean architecture review, modernization roadmap, live presentation |

---

### 4.6 Frequently Asked Questions (FAQ)

1. **Do you need access to our entire codebase?**
   - _Answer_: Only to the relevant repository, branch, and configuration required to reproduce and fix the defect. Access is covered by a standard NDA.
2. **How do you test the fix before handover?**
   - _Answer_: Every fix is verified locally and against staging with unit and integration tests written to reproduce the specific issue.
3. **What happens if the defect is caused by backend services?**
   - _Answer_: If root-cause analysis reveals a backend or database failure, I provide full network logs, payload payloads, and clear diagnostic notes for your backend team to resolve.
