---
name: firebase-security
description: Audits, hardens, and generates secure Firebase and Google Cloud architectures, including Firestore/Storage security rules, App Check, Cloud Functions instance caps, API key restrictions, and billing safeguards.
---

# 🛡️ Firebase & Google Cloud Security Skill (Active Project Authority)

A self-contained, production-grade security authority for Firebase and Google Cloud applications. Use this skill when designing, implementing, auditing, or reviewing Firebase features to prevent data leaks, bot abuse, unauthorized access, and denial-of-wallet billing attacks.

> [!NOTE]
> **Active Workspace Status**: This file reflects the real-time security posture of the **`youssefathalla-portfolio`** project.
>
> - **AI / Codebase Items (Section B)** are audited and verified in code.
> - **Human / Console Items (Section A)** track external cloud dashboard configurations required before production deployment.
> - For a blank starter template to use on new projects, refer to `docs/take-away/firebase-security/SKILL.md`.

---

## 🚦 When to Activate This Skill

1. **Designing or modifying Security Rules** (`firestore.rules`, `storage.rules`).
2. **Setting up or configuring a new Firebase project** (Google Cloud API keys, domains, App Check).
3. **Writing or reviewing Cloud Functions** (webhooks, background triggers, secret management, concurrency).
4. **Investigating security alerts** (e.g., GitHub secret scanning alerts on Google API keys).
5. **Pre-production security audits** before launching a feature or going live.

---

## 👥 Division of Responsibilities: Human vs. AI

A secure Firebase setup requires cooperation between human console operations and automated codebase architectures. Neither can complete the setup alone.

```text
┌─────────────────────────────────────────────────────────┐
│              FIREBASE & GCP SECURITY MATRIX             │
├────────────────────────────┬────────────────────────────┤
│ 👤 HUMAN / DEVELOPER        │ 🤖 AI / AGENT              │
│ (Console & External Setup) │ (Codebase & Architecture)  │
├────────────────────────────┼────────────────────────────┤
│ • GCP API Key Restrictions │ • firestore.rules logic    │
│ • GCP Billing Budgets      │ • storage.rules logic      │
│ • Firebase App Check setup │ • App Check client init    │
│ • Identity Platform flags  │ • Functions concurrency cap│
│ • Secret Manager values    │ • defineSecret() params    │
│ • 3rd-party webhook config │ • HMAC timing-safe verify  │
│ • Custom domain DNS/SSL    │ • Bounded queries & limits │
│ • IAM role assignments     │ • .gitignore secret guards │
└────────────────────────────┴────────────────────────────┘
```

---

## 🏛️ Core Architectural Pillars

### 1. Key & Credential Architecture (Public Identifiers vs. Server Secrets)

| Credential                                                  | Destination                                                   | Is it a Secret?            | Role & Responsible Party                                                                                                                                                                                            |
| :---------------------------------------------------------- | :------------------------------------------------------------ | :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Firebase Client Config** (`apiKey`, `projectId`, `appId`) | Frontend code (`src/environments/environment.ts`, bundled JS) | **NO** (Public Identifier) | Identifies project to Google APIs. GitHub flags via regex (`AIzaSy...`).<br>👤 **Human**: Lock down in Google Cloud Console.<br>🤖 **AI**: Keep clean in frontend config; never place backend secrets alongside it. |
| **Service Account Key** (`serviceAccountKey.json`, `*.pem`) | Backend/CI only                                               | **YES (FATAL)**            | Complete, root admin access bypassing all security rules.<br>🤖 **AI**: Ensure added to `.gitignore`.<br>👤 **Human**: NEVER commit to Git or expose in frontend bundles.                                           |

#### 👤 Human Action: Google Cloud Console API Key Lockdown Protocol

The Firebase web API key (`AIzaSyDwc...`) must be restricted in [Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials):

1. **Application Restrictions**:
   - Select **Websites (HTTP referrers)**.
   - Add only verified application domains for this project:
     - `http://localhost:4200`
     - `https://youssefathalla.com/*`
     - `https://www.youssefathalla.com/*`
     - `https://youssefathalla-portfolio.web.app/*`
     - `https://youssefathalla-portfolio.firebaseapp.com/*`
2. **API Restrictions**:
   - Select **Restrict key**.
   - Limit to Firebase services used (_Identity Toolkit API_, _Token Service API_, _Firebase Installations API_).
   - **Never** permit expensive, unrelated APIs (e.g., _Maps JavaScript_, _Translation_, _Vertex AI_) on this key.

---

### 2. Firestore Database Hardening (The Gold Standard)

#### 🤖 AI Action: Default Deny Foundation & Token Claims

`firestore.rules` starts with default deny, blocks nested subcollections, and checks roles via custom claims (`request.auth.token.admin == true`), never client document fields:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true; // Custom Claim, NOT document data
    }

    match /submissions/{submissionId} {
      // App Check token required on create
      allow create: if request.app.appId != null
        && isValidCreate(request.resource.data);

      allow read: if isAdmin();
      allow update: if isAdmin() && isValidUpdate(request.resource.data, resource.data);
      allow delete: if false;

      // Subcollections explicitly blocked
      match /{subpath=**} {
        allow read, write: if false;
      }
    }

    // Catch-all Default Deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

#### 🎯 The Red-Team Attack Audit Vectors (AI & Human Review)

1. **The Update Bypass:** Can a user create a valid document and then `update` it into a malicious state (escalating roles, overwriting `createdAt`, or inflating payloads)?
2. **Authority Source:** Does any rule trust user-supplied payload data (e.g., `request.resource.data.role == 'admin'`) instead of verified auth tokens (`request.auth.token.admin == true`)?
3. **Timestamp Forgery:** Are timestamps enforced with `request.time` (e.g., `request.resource.data.createdAt == request.time`)?
4. **Resource Exhaustion / 1MB DoS:** Does every string field have a `.size()` limit (e.g., `notes.size() <= 4000`, `tags.size() <= 20`)? Unbounded strings permit 1MB document inflation attacks.
5. **Unbounded Collections:** Do client-side queries enforce `.limit(n)` to avoid billing spikes on large collections?

---

### 3. Firebase App Check (Bot & Scraping Defense)

App Check ensures that incoming traffic originates exclusively from your genuine web or mobile application, blocking bots, cURL scripts, and scrapers:

- 👤 **Human Responsibility**:
  1. Register the app in [Firebase Console > Security > App Check](https://console.firebase.google.com/).
  2. Create a **reCAPTCHA v3** (invisible) site key and register it in the Firebase Console.
  3. Monitor incoming requests in the App Check dashboard until verified, then switch Firestore to **Enforce**.
- 🤖 **AI Responsibility**:
  1. Initialize App Check in `FirebaseAppService` (`initializeAppCheck`, `ReCaptchaV3Provider`, `CustomProvider` for local emulator/debug tokens).
  2. Require `request.app.appId != null` on public write rules in `firestore.rules`.
  3. For callable Cloud Functions, set `enforceAppCheck: true` or inspect `request.app` on HTTPS requests.

---

### 4. Cloud Storage Hardening

Prevent malware distribution, copyright abuse, and bandwidth exhaustion:

> [!NOTE]
> This portfolio project does not currently use Firebase Storage. If Storage is added in the future, apply default deny and strict image MIME/size constraints (`< 5MB`).

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/(jpeg|png|webp)');
      allow delete: if request.auth != null && request.auth.uid == userId;
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

### 5. Cloud Functions & Serverless Resilience

- 🤖 **AI Responsibility (Implemented in `functions/src/`)**:
  1. **Instance Capping (`maxInstances: 10`)**: Configured on `onCalcomWebhook` and `onSubmissionCreated` to cap concurrency during traffic surges.
  2. **Secret Management**: Zero hardcoded secrets in source files or `firebase.json`. Managed via `defineSecret()` (`CALCOM_WEBHOOK_SECRET`, `RESEND_API_KEY`, `NOTIFICATION_ADDRESS`).
  3. **Webhook Security**:
     - Constant-time HMAC signature verification (`crypto.timingSafeEqual`) in `functions/src/webhook-function.ts`.
     - Request body size limit (`MAX_BODY_BYTES = 65_536`).
     - Replay attack defenses (rejecting events drifting > 300 seconds from server time).
- 👤 **Human Responsibility**:
  1. Set production secret values in Secret Manager via `firebase functions:secrets:set <KEY>` or Google Cloud Console.
  2. Configure webhook URL (`https://europe-west1-youssefathalla-portfolio.cloudfunctions.net/onCalcomWebhook`) and shared secret in Cal.com dashboard.

```typescript
// Implemented in functions/src/webhook-function.ts
export const onCalcomWebhook = onRequest(
  {
    region: 'europe-west1',
    secrets: [CALCOM_WEBHOOK_SECRET],
    timeoutSeconds: 60,
    maxInstances: 10,
  },
  async (req, res) => {
    // POST only guard
    // Body size guard (64KB)
    // Secret store guard
    // Constant-time timingSafeEqual HMAC verification
    // Freshness drift <= 300s guard
  },
);
```

---

### 6. Denial-of-Wallet & Billing Protections

Firebase Blaze plan auto-scales infinitely. Without proactive guardrails, attacks can generate catastrophic invoices:

- 👤 **Human Responsibility**:
  1. In [Google Cloud Billing](https://console.cloud.google.com/billing), configure budget alerts with email notifications (50%, 90%, 100% thresholds).
     _(Note: Email enumeration protection is enabled by default on all modern Firebase projects since September 2023 via `enableImprovedEmailPrivacy: true` — verified active on this project)._
- 🤖 **AI Responsibility**:
  1. Ensure every client-side Firestore query specifies `.limit(n)` or uses cursor pagination. Never emit unbounded queries.
  2. Enforce transaction timeouts (`withDeadline`) and rate-limit counters in Cloud Functions.

---

## 📋 The Master Security Checklist (Portfolio Status)

### 👤 Section A: Human / Developer Checklist (Console & Cloud Dashboard)

Track these manual cloud operations required in the Google Cloud and Firebase consoles:

| Status | Category               | Requirement                                       | Location / Action Details                                                                                                                                                                                                                                                                          |
| :----: | :--------------------- | :------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  [x]   | **API Security**       | Restrict API Key to **Websites (HTTP referrers)** | [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)<br>Target key: `AIzaSyDwc16key5P7fONl15iECdd4VORfGsCEU8`<br>Add: `http://localhost:4200`, `https://youssefathalla.com/*`, `https://www.youssefathalla.com/*`, `https://youssefathalla-portfolio.web.app/*` |
|  [x]   | **API Security**       | Restrict API Key to **Firebase APIs only**        | In the same key settings, choose **Restrict key** and limit to: _Identity Toolkit API_, _Token Service API_, _Firebase Installations API_.                                                                                                                                                         |
|  [x]   | **Billing Protection** | Configure Budget Threshold Alerts                 | [Google Cloud Billing > Budgets](https://console.cloud.google.com/billing)<br>Set budget (e.g., $25/mo) with email alert thresholds at 50%, 90%, and 100%.                                                                                                                                         |
|  [x]   | **App Check**          | Register Web App & reCAPTCHA Key                  | [Firebase Console > App Check](https://console.firebase.google.com/project/youssefathalla-portfolio/appcheck)<br>Confirmed site key `6LdDSoItAAAAAC8KJReXlMik6OGtkmy5jjGO0Ff7` registered under reCAPTCHA v3.                                                                                      |
|  [x]   | **App Check**          | Enforce App Check for Cloud Firestore             | In App Check dashboard, verified Cloud Firestore is set to **"Enforced"**.                                                                                                                                                                                                                         |
|  [x]   | **Secret Manager**     | Set Production Secret Values                      | Verified in Secret Manager via CLI: `CALCOM_WEBHOOK_SECRET` (v5 ENABLED), `RESEND_API_KEY` (v1 ENABLED), `NOTIFICATION_ADDRESS` (v1 ENABLED).                                                                                                                                                      |
|  [x]   | **Webhooks**           | Configure Cal.com Webhook Secret & URL            | In Cal.com Developer settings, webhook endpoint URL configured pointing to `onCalcomWebhook` with matching `CALCOM_WEBHOOK_SECRET`.                                                                                                                                                                |

---

### 🤖 Section B: AI / Agent Checklist (Codebase, Rules & Architecture)

Verified implementations in this repository:

| Status | Category            | Requirement                              | Code / File Reference                                                                                                             |
| :----: | :------------------ | :--------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
|  [x]   | **Firestore Rules** | Default Deny Catch-All                   | `firestore.rules`: Line 91 (`match /{document=**} { allow read, write: if false; }`)                                              |
|  [x]   | **Firestore Rules** | Subcollections Explicitly Denied         | `firestore.rules`: Line 85 (`match /{subpath=**} { allow read, write: if false; }`)                                               |
|  [x]   | **Firestore Rules** | Roles Checked via Auth Token Claims      | `firestore.rules`: Line 9 (`request.auth.token.admin == true`)                                                                    |
|  [x]   | **Firestore Rules** | Public Writes Require App Check Token    | `firestore.rules`: Line 71 (`allow create: if request.app.appId != null ...`)                                                     |
|  [x]   | **Firestore Rules** | Schema & Payload Size Limits Enforced    | `firestore.rules`: `hasOnly`, `hasAll`, `notes.size() <= 4000`, `tags.size() <= 20`, server timestamp `createdAt == request.time` |
|  [x]   | **Cloud Functions** | Concurrency Capped (`maxInstances: 10`)  | `functions/src/webhook-function.ts` (line 202) & `notification-function.ts` (line 37)                                             |
|  [x]   | **Cloud Functions** | Secrets Managed via `defineSecret()`     | `functions/src/`: `CALCOM_WEBHOOK_SECRET`, `RESEND_API_KEY`, `NOTIFICATION_ADDRESS` via `defineSecret()`                          |
|  [x]   | **Cloud Functions** | Webhook Body Capped (`<= 64KB`)          | `functions/src/webhook-function.ts`: `MAX_BODY_BYTES = 65_536` guard                                                              |
|  [x]   | **Cloud Functions** | Webhook HMAC Verified via Constant Time  | `functions/src/webhook-function.ts`: `crypto.timingSafeEqual` with buffer length check                                            |
|  [x]   | **Cloud Functions** | Replay Protection / Clock Skew Limit     | `functions/src/webhook-function.ts`: `isFresh` rejects drift > 300 seconds                                                        |
| [N/A]  | **Storage Rules**   | File Size & MIME Whitelist               | Storage is not used in this portfolio project.                                                                                    |
|  [x]   | **Frontend Client** | App Check Initialized in Browser         | `src/app/core/firebase/firebase-app.service.ts`: `activateAppCheck` with `ReCaptchaV3Provider` & debug token                      |
|  [x]   | **Frontend Client** | Public Config Clean of Server Secrets    | `src/environments/environment.ts` & `prod.ts`: Public identifiers only, zero server secrets                                       |
|  [x]   | **Frontend Client** | Bounded Firestore Queries                | `functions/src/webhook-function.ts` & client queries use `.limit(1)` / bounded constraints                                        |
|  [x]   | **Git Hygiene**     | Credential Files Blocked in `.gitignore` | `.gitignore`: `*serviceAccount*.json`, `*credentials*.json`, `*.pem`, `.env*` blocked                                             |

---

## 🤝 Handshake & Workflow Protocol

When auditing, deploying, or adding features:

1. **AI Verification**: Whenever the AI works with Firebase features, it verifies and keeps **Section B** updated. If code rules change, it updates `firestore.rules` and marks the item.
2. **Developer Console Tasks**: The developer reviews **Section A** to complete the cloud console steps before production release. Once verified in the Google Cloud / Firebase console, check the box (`[x]`).
3. **Synchronizing Documentation**: Remember to keep `.kiro/` as the single source of truth and run `npm run sync:agents` to mirror updates into `.agents/`.
