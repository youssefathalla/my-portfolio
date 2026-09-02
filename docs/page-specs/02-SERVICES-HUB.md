# Services Hub Page (`/services` and `/ar/services`)

## 1. Page Overview

- **Route Key**: `services-hub`
- **Canonical Paths**:
  - English: `/services`
  - Arabic: `/ar/services`
- **Component File**: `src/app/pages/services-hub/services-hub.ts` & `src/app/pages/services-hub/services-hub.html`
- **Purpose**: A goal-oriented decision matrix and selector hub where visitors pick their required engagement outcome rather than arbitrary service labels.

---

## 2. SEO & Route Metadata

| Field                 | English (`en`)                                                                                                                                                   | Arabic (`ar`)                                                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Page Title**        | `Services & Engagement Models \| Youssef Fathalla`                                                                                                               | `نماذج الخدمات والتعاقد \| Youssef Fathalla`                                                                                                 |
| **Meta Description**  | `Explore four front-end engagement models: fixed-price MVP builds, enterprise augmentation, transparent hourly sprint packages, and tactical production audits.` | `استعرض أربعة نماذج للتعاقد في هندسة الواجهات الأمامية: بناء تطبيق بسعر ثابت، تعزيز الفرق، باقات السبرنت بالساعات، والتدقيق الفني التكتيكي.` |
| **Social Image**      | `/og/og-image.png` (1200×630px)                                                                                                                                  | `/og/og-image.png` (1200×630px)                                                                                                              |
| **Robots Directives** | `index, follow`                                                                                                                                                  | `index, follow`                                                                                                                              |

---

## 3. Visual & Layout Hierarchy

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. Breadcrumb Trail (`Home` > `Services`)                   │
├─────────────────────────────────────────────────────────────┤
│ 2. Page Headline (`<h1>`)                                   │
├─────────────────────────────────────────────────────────────┤
│ 3. 2x2 Outcome Selector Grid (4 Interactive Cards)          │
│    - Card 1: Fixed-Price MVP Build                          │
│    - Card 2: Enterprise Augmentation                        │
│    - Card 3: Hourly Sprints                                 │
│    - Card 4: Tactical Audits                                │
├─────────────────────────────────────────────────────────────┤
│ 4. Conversion CTA Group (Primary Action + Booking Link)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Content & Selector Card Specifications

### 4.1 Page Headline (`<h1>`)

- **EN**: `Pick the outcome you need, not the name of a service`
- **AR**: `اختر النتيجة والهدف الذي تريده، لا مجرد اسم الخدمة`

---

### 4.2 The 4 Selector Cards (`<h2>`)

#### Card 1: Fixed-Price MVP Build (`/services/fixed-mvp`)

- **Goal Statement (`<h2>`)**:
  - EN: `I need a complete application built for me, end to end, on a fixed budget and timeline.`
  - AR: `أحتاج إلى بناء تطبيق ويب متكامل بالكامل، بميزانية وجدول زمني محددين.`
- **Target Audience**:
  - EN: `For founders, business owners, and product leaders who want to hand off the entire build.`
  - AR: `لرواد الأعمال وأصحاب المشاريع وقادة المنتجات الذين يريدون تسليم المشروع بالكامل.`
- **Offer Summary**:
  - EN: `A turnkey engagement that takes your idea from requirements to a deployed, tested application, with staged payments and a post-launch warranty included.`
  - AR: `تعاقد متكامل ينقل فكرتكم من مرحلة المتطلبات إلى تطبيق منشور ومختبر بالكامل، مع دفعات مرحلية وضمان ما بعد الإطلاق.`
- **Target Path**: `services/fixed-mvp` (Arabic: `ar/services/fixed-mvp`)

---

#### Card 2: Enterprise Augmentation (`/services/enterprise-augmentation`)

- **Goal Statement (`<h2>`)**:
  - EN: `I need a senior engineer embedded in my existing team, working inside our own process.`
  - AR: `أحتاج إلى مهندس أول مدمج داخل فريقي القائم، يعمل وفق سير عملنا ومعاييرنا.`
- **Target Audience**:
  - EN: `For technology leads and engineering managers evaluating a long-term contractor.`
  - AR: `للقادة التقنيين ومديري الهندسة البرمجية الذين يبحثون عن متعاقد خبير طويل الأجل.`
- **Offer Summary**:
  - EN: `Ongoing front-end engineering capacity that plugs into your architecture, your code review standards, and your sprint cadence, with privacy-isolated AI-assisted delivery.`
  - AR: `دعم هندسي مستمر للواجهات الأمامية يتكامل مع بنيتكم ومعايير مراجعة الكود ودورات السبرنت، مع تسريع الإنجاز بالذكاء الاصطناعي مع عزل الخصوصية.`
- **Target Path**: `services/enterprise-augmentation` (Arabic: `ar/services/enterprise-augmentation`)

---

#### Card 3: Hourly Sprints (`/services/hourly-sprints`)

- **Goal Statement (`<h2>`)**:
  - EN: `I need extra engineering hands for a defined stretch of work, without a long-term contract.`
  - AR: `أحتاج إلى خبرات هندسية إضافية لإنجاز مهام محددة، دون الحاجة لالتزام طويل الأجل.`
- **Target Audience**:
  - EN: `For product managers, design agencies, and development teams short on front-end capacity.`
  - AR: `لمديري المنتجات ووكالات التصميم وفرق التطوير التي تواجه نقصًا في طاقة الواجهات الأمامية.`
- **Offer Summary**:
  - EN: `A transparent block of engineering time for design-to-code conversion, API integration, and isolated feature work, with visible time tracking and no ongoing commitment.`
  - AR: `باقة ساعات عمل هندسية شفافة لتحويل التصاميم إلى كود، وتكامل واجهات البرمجة، وبناء الميزات المستقلة، مع تتبع مرئي للوقت.`
- **Target Path**: `services/hourly-sprints` (Arabic: `ar/services/hourly-sprints`)

---

#### Card 4: Tactical Audits (`/services/tactical-audits`)

- **Goal Statement (`<h2>`)**:
  - EN: `I have a production problem right now and need someone who can start fast.`
  - AR: `أواجه مشكلة حرجة في بيئة الإنتاج حاليًا وأحتاج إلى خبير يبدأ المعالجة فورًا.`
- **Target Audience**:
  - EN: `For application owners facing performance problems or urgent production defects.`
  - AR: `لأصحاب التطبيقات الذين يواجهون مشكلات أداء أو أعطالاً طارئة في بيئة الإنتاج.`
- **Offer Summary**:
  - EN: `A focused audit that diagnoses the defect or performance bottleneck, delivers a fix on an isolated branch for review, and hands you a clear modernization plan.`
  - AR: `تدقيق فني مركز يشخص الخلل أو عنق زجاجة الأداء، ويسلم الحل في فرع معزول للمراجعة، مع خطة تحديث واضحة.`
- **Target Path**: `services/tactical-audits` (Arabic: `ar/services/tactical-audits`)

---

### 4.3 Closing Conversion CTA Group

- **Primary CTA**: `Schedule a Scoping Call` (`حجز جلسة تحديد النطاق`) $\rightarrow$ `/contact`.
- **Secondary CTA**: `Review Work Policies & Guarantees` (`الاطلاع على السياسات والضمانات`) $\rightarrow$ `/policies`.

---

## 5. Technical Requirements & Accessibility

- **Breadcrumb Navigation**: `<app-breadcrumb>` must be the first interactive element inside container.
- **Card Interactive Contract**: Each card is wrapped in a single focusable `<a>` link (`min-h-[44px]`), ensuring 100% of the card area is activatable.
- **Heading Semantics**: Single `<h1>` for page headline $\rightarrow$ each card title is an `<h2>`.
- **Responsive Layout**: `grid-cols-1` on mobile ($<768\text{px}$) $\rightarrow$ `md:grid-cols-2` on tablet/desktop.
