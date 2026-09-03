---
name: firebase-security
description: Audits, hardens, and generates secure Firebase and Google Cloud architectures, including Firestore/Storage security rules, App Check, Cloud Functions instance caps, API key restrictions, and billing safeguards.
---

# 🛡️ Firebase & Google Cloud Security Skill (Take-Away Template)

A self-contained, production-grade security authority for Firebase and Google Cloud applications. Use this skill when designing, implementing, auditing, or reviewing Firebase features to prevent data leaks, bot abuse, unauthorized access, and denial-of-wallet billing attacks.

> [!TIP]
> **New Project Starter Template**: This file lives in `docs/take-away/firebase-security/SKILL.md` with all checkboxes empty (`[ ]`). When starting a new project, copy this directory into `.kiro/skills/firebase-security/` and mark items as `[x]` as they are completed. Keep this template file pristine with unchecked boxes.

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

| Credential                                                  | Destination                                  | Is it a Secret?            | Role & Responsible Party                                                                                                                                                                                            |
| :---------------------------------------------------------- | :------------------------------------------- | :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Firebase Client Config** (`apiKey`, `projectId`, `appId`) | Frontend code (`environment.ts`, bundled JS) | **NO** (Public Identifier) | Identifies project to Google APIs. GitHub flags via regex (`AIzaSy...`).<br>👤 **Human**: Lock down in Google Cloud Console.<br>🤖 **AI**: Keep clean in frontend config; never place backend secrets alongside it. |
| **Service Account Key** (`serviceAccountKey.json`, `*.pem`) | Backend/CI only                              | **YES (FATAL)**            | Complete, root admin access bypassing all security rules.<br>🤖 **AI**: Ensure added to `.gitignore`.<br>👤 **Human**: NEVER commit to Git or expose in frontend bundles.                                           |

#### 👤 Human Action: Google Cloud Console API Key Lockdown Protocol

Every Firebase web API key must be restricted in [Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials):

1. **Application Restrictions**:
   - Select **Websites (HTTP referrers)**.
   - Add only verified application domains:
     - `http://localhost:<port>` (e.g., `http://localhost:4200`)
     - `https://<yourdomain.com>/*`
     - `https://www.<yourdomain.com>/*`
     - `https://<project-id>.web.app/*`
     - `https://<app-name>--<project-id>.<region>.hosted.app/*` (if using Firebase App Hosting)
2. **API Restrictions**:
   - Select **Restrict key**.
   - Limit to Firebase services used (e.g., _Identity Toolkit API_, _Token Service API_, _Firebase Installations API_).
   - **Never** permit expensive, unrelated APIs (e.g., _Maps JavaScript_, _Translation_, _Vertex AI_) on this key.

---

### 2. Firestore Database Hardening (The Gold Standard)

#### 🤖 AI Action: Default Deny Foundation & Token Claims

Every rules file must start with default deny, block nested subcollections unless explicitly needed, and check roles via custom claims (`request.auth.token.admin == true`), never client document fields:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    function isAdmin() {
      return isAuthenticated() && request.auth.token.admin == true; // Custom Claim, NOT document data
    }

    // Explicit Collection Rules
    match /users/{userId} {
      allow read, update: if isOwner(userId);
      allow create: if isAuthenticated() && request.resource.data.email == request.auth.token.email;
      allow delete: if false;
    }

    // Public Submissions (e.g., Contact Form / Intake)
    match /submissions/{submissionId} {
      allow create: if request.app.appId != null // App Check Enforced
        && request.resource.data.keys().hasOnly(['type', 'status', 'createdAt', 'payload'])
        && request.resource.data.status == 'new'
        && request.resource.data.createdAt == request.time; // Server Timestamp Tamper Protection
      allow read, update, delete: if isAdmin();

      // Explicitly deny unexpected subcollections
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
4. **Resource Exhaustion / 1MB DoS:** Does every string field have a `.size()` limit (e.g., `field.size() <= 4000`)? Unbounded strings permit 1MB document inflation attacks.
5. **Unbounded Collections:** Do client-side queries enforce `.limit(n)` to avoid billing spikes on large collections?

---

### 3. Firebase App Check (Bot & Scraping Defense)

App Check ensures that incoming traffic originates exclusively from your genuine web or mobile application, blocking bots, cURL scripts, and scrapers:

- 👤 **Human Responsibility**:
  1. Register the app in [Firebase Console > Security > App Check](https://console.firebase.google.com/).
  2. Create a **reCAPTCHA v3** (invisible) or **reCAPTCHA Enterprise** site key and register it.
  3. Monitor incoming requests in the App Check dashboard until verified, then switch Firestore / Cloud Functions to **Enforce**.
- 🤖 **AI Responsibility**:
  1. Initialize App Check in the frontend client SDK (`initializeAppCheck`, `ReCaptchaV3Provider`, debug token support for local development/emulators).
  2. Require `request.app.appId != null` on public write rules.
  3. For callable Cloud Functions, set `enforceAppCheck: true` or inspect `request.app` on HTTPS requests.

---

### 4. Cloud Storage Hardening

Prevent malware distribution, copyright abuse, and bandwidth exhaustion:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.uid == userId
        // Enforce 5MB limit for uploads
        && request.resource.size < 5 * 1024 * 1024
        // Enforce safe image MIME types
        && request.resource.contentType.matches('image/(jpeg|png|webp)');
      allow delete: if request.auth != null && request.auth.uid == userId;
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

- 🤖 **AI Responsibility**: Implement strict path boundaries, file size caps, MIME validation, and default deny.
- 👤 **Human Responsibility**: Verify default bucket selection in Firebase Console and configure CORS if using custom domains.

---

### 5. Cloud Functions & Serverless Resilience

- 🤖 **AI Responsibility**:
  1. **Instance Capping (`maxInstances`)**: Always specify `maxInstances: 10` on HTTPS endpoints and background event triggers to cap concurrency during traffic surges.
  2. **Secret Management**: Never hardcode API keys or put private secrets in `firebase.json`. Use `defineSecret()` with Google Cloud Secret Manager.
  3. **Webhook Security**:
     - Verify cryptographic HMAC signatures using constant-time comparison (`crypto.timingSafeEqual`) to prevent timing attacks.
     - Enforce request body size limits (`maxBodyBytes <= 65536`).
     - Check timestamp freshness (reject events drifting > 300 seconds to defeat replay attacks).
- 👤 **Human Responsibility**:
  1. Set production secret values in Secret Manager via `firebase functions:secrets:set <KEY>` or Google Cloud Console.
  2. Configure webhook URLs and shared secrets in external service dashboards (e.g., Stripe, Cal.com).

```typescript
// Example: Hardened HTTPS Webhook Function
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as crypto from 'node:crypto';

const WEBHOOK_SECRET = defineSecret('WEBHOOK_SECRET');

export const onWebhook = onRequest(
  {
    secrets: [WEBHOOK_SECRET],
    maxInstances: 10,
    timeoutSeconds: 60,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }
    // Body size guard (64KB)
    if ((req.rawBody?.length ?? 0) > 65_536) {
      res.status(413).send('Payload Too Large');
      return;
    }
    // Verify constant-time HMAC signature
    // ...
  },
);
```

---

### 6. Denial-of-Wallet & Billing Protections

Firebase Blaze plan auto-scales infinitely. Without proactive guardrails, attacks can generate catastrophic invoices:

- 👤 **Human Responsibility**:
  1. In [Google Cloud Billing](https://console.cloud.google.com/billing), configure budget alerts with email notifications (e.g., 50%, 90%, 100% thresholds).
  2. In Identity Platform / Firebase Auth settings, enable **Email enumeration protection** to prevent attackers from scraping user accounts.
- 🤖 **AI Responsibility**:
  1. Ensure every client-side Firestore query specifies `.limit(n)` or uses cursor pagination. Never emit unbounded queries.
  2. Enforce transaction timeouts and rate-limit counters in Cloud Functions.

---

## 📋 The Master Security Checklist

Use these checklists to track completion across both human operations and codebase configurations. In new projects, all items begin unchecked (`[ ]`).

### 👤 Section A: Human / Developer Checklist (Console & Cloud Dashboard)

| Status | Category               | Requirement                                       | Location / Action                                                                                                                                                                    |
| :----: | :--------------------- | :------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  [ ]   | **API Security**       | Restrict API Key to **Websites (HTTP referrers)** | [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)<br>Add `http://localhost:<port>`, `https://<yourdomain>/*`, `https://<project-id>.web.app/*` |
|  [ ]   | **API Security**       | Restrict API Key to **Firebase APIs only**        | Restrict to _Identity Toolkit_, _Token Service_, _Installations_. Explicitly exclude Maps, Translate, Vertex AI.                                                                     |
|  [ ]   | **Billing Protection** | Configure Budget Threshold Alerts                 | [Google Cloud Billing > Budgets](https://console.cloud.google.com/billing)<br>Set alert thresholds at 50%, 90%, and 100% with email notifications.                                   |
|  [ ]   | **App Check**          | Register Web App & reCAPTCHA Key                  | [Firebase Console > App Check](https://console.firebase.google.com/)<br>Register web app with reCAPTCHA v3 or Enterprise site key.                                                   |
|  [ ]   | **App Check**          | Enforce App Check for Firestore & Functions       | After monitoring traffic and confirming valid tokens, switch Firestore from "Monitor" to **"Enforce"**.                                                                              |
|  [ ]   | **Auth Protection**    | Enable Email Enumeration Protection               | [Google Cloud Console > Identity Platform > Settings](https://console.cloud.google.com/customer-identity/settings) or Firebase Auth settings.                                        |
|  [ ]   | **Secret Manager**     | Set Production Secret Values                      | Run `firebase functions:secrets:set <KEY>` via CLI or set in [Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager).                                       |
|  [ ]   | **Webhooks**           | Configure External Webhook Secret & URL           | In provider dashboard (e.g. Cal.com, Stripe), register function HTTPS URL and matching secret.                                                                                       |

---

### 🤖 Section B: AI / Agent Checklist (Codebase, Rules & Architecture)

| Status | Category            | Requirement                              | Code / File Reference                                                                                                |
| :----: | :------------------ | :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
|  [ ]   | **Firestore Rules** | Default Deny Catch-All                   | `firestore.rules`: `match /{document=**} { allow read, write: if false; }`                                           |
|  [ ]   | **Firestore Rules** | Subcollections Explicitly Denied         | `firestore.rules`: `match /{subpath=**} { allow read, write: if false; }` on parent collections.                     |
|  [ ]   | **Firestore Rules** | Roles Checked via Auth Token Claims      | `firestore.rules`: Check `request.auth.token.admin == true`, never document data fields.                             |
|  [ ]   | **Firestore Rules** | Public Writes Require App Check Token    | `firestore.rules`: `allow create: if request.app.appId != null ...`                                                  |
|  [ ]   | **Firestore Rules** | Schema & Payload Size Limits Enforced    | `firestore.rules`: Validate keys (`hasOnly`), string lengths (`.size() <= 4000`), server timestamp (`request.time`). |
|  [ ]   | **Cloud Functions** | Concurrency Capped (`maxInstances: 10`)  | `functions/src/`: Set `maxInstances: 10` and `timeoutSeconds` on all callable, HTTP, and event triggers.             |
|  [ ]   | **Cloud Functions** | Secrets Managed via `defineSecret()`     | Zero plaintext secrets in code or `firebase.json`; all secrets declared via `defineSecret()`.                        |
|  [ ]   | **Cloud Functions** | Webhook Body Capped (`<= 64KB`)          | Raw request body size validated before parsing or signature check.                                                   |
|  [ ]   | **Cloud Functions** | Webhook HMAC Verified via Constant Time  | Signature verified using `crypto.timingSafeEqual` over buffers of verified equal length.                             |
|  [ ]   | **Cloud Functions** | Replay Protection / Clock Skew Limit     | Events drifting > 300 seconds from server time rejected.                                                             |
|  [ ]   | **Storage Rules**   | File Size & MIME Whitelist               | `storage.rules`: Size bounded (`< 5MB`) and MIME checked against safe regex.                                         |
|  [ ]   | **Frontend Client** | App Check Initialized in Browser         | Angular service initializes `initializeAppCheck` with `ReCaptchaV3Provider` and dev debug token support.             |
|  [ ]   | **Frontend Client** | Public Config Clean of Server Secrets    | `environment.ts`: Contains public identifiers only (`apiKey`, `projectId`, `appId`). Zero server keys.               |
|  [ ]   | **Frontend Client** | Bounded Firestore Queries                | Client queries always use `.limit(n)` or cursor pagination.                                                          |
|  [ ]   | **Git Hygiene**     | Credential Files Blocked in `.gitignore` | `*serviceAccount*.json`, `*credentials*.json`, `*.pem`, `.env*` blocked in `.gitignore`.                             |

---

## 🤝 Handshake & Workflow Protocol

When applying this skill to a project:

1. **AI Audit Phase**: The AI inspects the codebase against **Section B** (Rules, Functions, Client, Git hygiene). Any verified item is checked `[x]`. Any missing item is implemented or flagged.
2. **Human Handoff Phase**: The AI reports the status of **Section A** to the developer, listing the exact URLs, domain strings, and commands required to complete console setups.
3. **Go-Live Sign-Off**: Deploy to production only when all items in both **Section A** and **Section B** are checked `[x]`.
