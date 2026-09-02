# Contact & Intake Wizard Page (`/contact`)

## 1. Page Overview

- **Route Key**: `contact`
- **Canonical Paths**:
  - English: `/contact`
  - Arabic: `/ar/contact`
- **Component Files**:
  - Main Page: `src/app/pages/contact/contact-page.ts` & `contact-page.html`
  - Intake Wizard: `src/app/pages/contact/intake-wizard/intake-wizard.ts` & `intake-wizard.html`
  - Cal.com Booking Widget: `src/app/sections/contact/booking-widget/booking-widget.ts`
  - Quick Form: `src/app/sections/contact/contact-form/contact-form.ts`
- **Purpose**: High-converting, interactive 4-step project intake wizard with Cal.com live booking integration, structured project brief dispatch to Cloud Firestore, and full no-JS / prerender fallback accessibility.

---

## 2. SEO & Route Metadata

| Field                 | English (`en`)                                                                                                               | Arabic (`ar`)                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Page Title**        | `Contact & Project Intake Wizard \| Youssef Fathalla`                                                                        | `تواصل معي ونموذج استلام المشاريع \| Youssef Fathalla`                                                                 |
| **Meta Description**  | `Tell me about your project, timeline, and budget, or book a discovery call directly through the interactive intake wizard.` | `أخبرني بتفاصيل مشروعك والجدول الزمني والميزانية، أو احجز مكالمة استكشافية مباشرة عبر معالج استلام المشاريع التفاعلي.` |
| **Social Image**      | `/og/og-image.png`                                                                                                           | `/og/og-image.png`                                                                                                     |
| **Robots Directives** | `index, follow`                                                                                                              | `index, follow`                                                                                                        |

---

## 3. The 4-Step Interactive Intake Wizard (`<mat-stepper>`)

```text
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Project Goal (Turnkey, Augmentation, Sprints, Audit)│
├─────────────────────────────────────────────────────────────┤
│ Step 2: Timeline (ASAP, 1 Mo, 1-3 Mos, Flexible)            │
├─────────────────────────────────────────────────────────────┤
│ Step 3: Budget Band (Small, Standard, Larger, Enterprise)   │
├─────────────────────────────────────────────────────────────┤
│ Step 4: Booking (Cal.com Embed) + Contact Details & Submit  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Step-by-Step Options & Schema

### Step 1: Project Goal (`goal`)

- **Question (`<h3>`)**: `What are you looking to build or solve?`
- **Options (Derived from Services Hub)**:
  1. `I need a complete application built for me, end to end, on a fixed budget and timeline.` (Fixed-Price MVP)
  2. `I need a senior engineer embedded in my existing team, working inside our own process.` (Enterprise Augmentation)
  3. `I need extra engineering hands for a defined stretch of work, without a long-term contract.` (Hourly Sprints)
  4. `I have a production problem right now and need someone who can start fast.` (Tactical Audits)

---

### Step 2: Timeline (`timeline`)

- **Question (`<h3>`)**: `What is your target timeline?`
- **Options**:
  1. `ASAP` (`في أقرب وقت ممكن (عاجل)`)
  2. `Within 1 Month` (`خلال شهر واحد`)
  3. `1-3 Months` (`من 1 إلى 3 أشهر`)
  4. `Flexible / Just Exploring` (`مرن / في مرحلة الاستكشاف`)

---

### Step 3: Budget Band (`budgetBand`)

- **Question (`<h3>`)**: `What is your expected project scale or budget band?`
- **Options (Zero currency symbols per privacy & compliance invariants)**:
  1. `Small Project` (`مشروع صغير`)
  2. `Standard Engagement` (`تعاقد قياسي`)
  3. `Larger Engagement` (`تعاقد كبير`)
  4. `Enterprise Scale` (`نطاق مؤسسي`)

---

### Step 4: Live Booking & Contact Form

- **Live Scheduling Widget**:
  - Embedded Cal.com / Google Calendar iframe with 30-minute discovery slot reservation.
  - Fallback notice if embed fails: `Booking is temporarily unavailable — please use the contact form below or reach out directly by email.`
- **Contact Fields & Validation Schema**:
  1. **Name (`name`)**:
     - Validation: Required, trimmed length 2-80 characters.
     - Error: `Please enter your name.`
  2. **Email (`email`)**:
     - Validation: Required, valid email pattern RFC 5322, normalized lowercase.
     - Error: `Please enter a valid email address.`
  3. **Message / Project Context (`message`)**:
     - Validation: Required, trimmed length 10-1000 characters.
     - Error: `Please provide at least 10 characters of project details.`

---

## 5. Submission Pipeline & Firestore Data Shape

When submitted, the payload is structured as an `IntakeWizardSubmission`:

```json
{
  "type": "intake-wizard",
  "locale": "en",
  "timestamp": "2026-08-25T15:30:00.000Z",
  "read": false,
  "status": "new",
  "payload": {
    "goal": "I need a complete application built for me...",
    "timeline": "Within 1 Month",
    "budgetBand": "Standard Engagement",
    "name": "Sarah Connor",
    "email": "sarah@example.com",
    "message": "We need a SaaS dashboard for logistic routing...",
    "bookingReference": "cal_abc123"
  }
}
```

---

## 6. Alternate Contact & Recovery Options

- **Copy Email Button**: Copies `youssefathalla@gmail.com` to clipboard and triggers `Copied!` tooltip/announcement for 2000ms.
- **Mailto Fallback**: `<a href="mailto:youssefathalla@gmail.com">`
- **Resume Download**: `<a href="/cv/contractor-cv.pdf" download>` with accessible name `Download CV (PDF)`.

---

## 7. No-JS / Prerender Static Fallback Form

For non-JavaScript clients, search engine crawlers, and SSR prerendering, a full native `<form method="post" action="/api/submit-contact">` is rendered with `<fieldset>` and `<legend>` for all 4 steps in a single accessible document flow.
