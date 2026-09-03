---
name: firebase-security
description: Audits, hardens, and generates secure Firebase and Google Cloud architectures, including Firestore/Storage security rules, App Check, Cloud Functions instance caps, API key restrictions, and billing safeguards.
---

# 🛡️ Firebase & Google Cloud Security Skill

A self-contained, production-grade security authority for Firebase and Google Cloud applications. Use this skill when designing, implementing, auditing, or reviewing Firebase features to prevent data leaks, bot abuse, unauthorized access, and denial-of-wallet billing attacks.

---

## 🚦 When to Activate This Skill

1. **Designing or modifying Security Rules** (`firestore.rules`, `storage.rules`).
2. **Setting up or configuring a new Firebase project** (Google Cloud API keys, domains, App Check).
3. **Writing or reviewing Cloud Functions** (webhooks, background triggers, secret management, concurrency).
4. **Investigating security alerts** (e.g., GitHub secret scanning alerts on Google API keys).
5. **Pre-production security audits** before launching a feature or going live.

---

## 🏛️ Core Architectural Pillars

### 1. Key & Credential Architecture (Public Identifiers vs. Server Secrets)

| Credential                                                  | Destination                                  | Is it a Secret?            | Risk & Defense                                                                                                          |
| :---------------------------------------------------------- | :------------------------------------------- | :------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **Firebase Client Config** (`apiKey`, `projectId`, `appId`) | Frontend code (`environment.ts`, bundled JS) | **NO** (Public Identifier) | Identifies project to Google APIs. GitHub flags it via regex (`AIzaSy...`). Defense: Lock down in Google Cloud Console. |
| **Service Account Key** (`serviceAccountKey.json`, `*.pem`) | Backend/CI only                              | **YES (FATAL)**            | Complete, root admin access bypassing all security rules. **NEVER** commit to Git. Add to `.gitignore`.                 |

#### 🔒 Google Cloud Console API Key Lockdown Protocol

Every Firebase web API key must be locked down in [Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials):

1. **Application Restrictions**:
   - Choose **Websites (HTTP referrers)**.
   - Add only verified application domains:
     - `http://localhost:4200` (or your local dev port)
     - `https://yourdomain.com/*`
     - `https://www.yourdomain.com/*`
     - `https://<project-id>.web.app/*`
     - `https://<app-name>--<project-id>.<region>.hosted.app/*` (if using Firebase App Hosting)
2. **API Restrictions**:
   - Choose **Restrict key**.
   - Limit to Firebase services used (e.g., _Identity Toolkit API_, _Token Service API_, _Firebase Installations API_).
   - **Never** permit expensive, unrelated APIs (e.g., _Maps JavaScript_, _Translation_, _Vertex AI_) on this key.

---

### 2. Firestore Database Hardening (The Gold Standard)

#### Default Deny Foundation

Every rules file must start with default deny and explicitly whitelist collections:

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
    }

    // Catch-all Default Deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

#### 🎯 The Red-Team Attack Checklist (Audit Vectors)

When reviewing rules, systematically attempt to break them:

1. **The Update Bypass:** Can a user create a valid document and then `update` it into a malicious state (escalating roles, overwriting `createdAt`, or inflating payloads)?
2. **Authority Source:** Does any rule trust user-supplied payload data (e.g., `request.resource.data.role == 'admin'`) instead of verified auth tokens (`request.auth.token.admin == true`)?
3. **Timestamp Forgery:** Are timestamps enforced with `request.time` (e.g., `request.resource.data.createdAt == request.time`)?
4. **Resource Exhaustion / 1MB DoS:** Does every string field have a `.size()` limit (e.g., `field.size() <= 2000`)? Unbounded strings permit 1MB document inflation attacks.
5. **Unbounded Collections:** Do client-side queries enforce `.limit(n)` to avoid billing spikes on large collections?

---

### 3. Firebase App Check (Bot & Scraping Defense)

App Check ensures that incoming traffic originates exclusively from your genuine web or mobile application, blocking bots, cURL scripts, and scrapers:

1. **Provider**: Use **reCAPTCHA v3** (invisible) or **reCAPTCHA Enterprise** for web.
2. **Rules Verification**: Require `request.app.appId != null` on public write endpoints (e.g., lead forms, contact submissions).
3. **Cloud Functions**: For callable functions, set `enforceAppCheck: true` or inspect `request.app` on HTTPS requests.

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
        // Enforce 5MB-10MB limit for raw mobile camera uploads, ~200KB if compressed
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

---

### 5. Cloud Functions & Serverless Resilience

1. **Instance Capping (`maxInstances`)**:
   Always specify `maxInstances: 10` on HTTPS endpoints and background event triggers to cap concurrency during traffic surges:

   ```typescript
   export const onWebhook = onRequest({ maxInstances: 10, timeoutSeconds: 60 }, handler);
   ```

2. **Secret Management**:
   Never hardcode API keys or put private secrets in `firebase.json`. Use `defineSecret()` with Google Cloud Secret Manager:

   ```typescript
   const apiKey = defineSecret('PAYMENT_GATEWAY_KEY');
   export const api = onRequest({ secrets: [apiKey] }, async (req, res) => {
     const key = apiKey.value();
   });
   ```

3. **Webhook Security**:
   - Verify cryptographic HMAC signatures using constant-time comparison (`crypto.timingSafeEqual`) to prevent timing attacks.
   - Enforce request body size limits (`maxBodyBytes <= 65536`).
   - Check timestamp freshness (reject events drifting > 300 seconds to defeat replay attacks).

---

### 6. Denial-of-Wallet & Billing Protections

Firebase Blaze plan auto-scales infinitely. Without proactive guardrails, attacks can generate catastrophic invoices:

1. **Billing Budget Alerts**:
   In [Google Cloud Billing](https://console.cloud.google.com/billing), configure budget alerts with email notifications at:
   - 50% threshold ($10)
   - 90% threshold ($25)
   - 100% threshold ($50)
2. **Identity Platform Protection**:
   In Identity Platform settings, enable **Email enumeration protection** to prevent attackers from discovering registered user emails.
3. **Query Bounds**:
   Every client-side Firestore query must specify `.limit(n)` or use cursor pagination. Never call unbounded `.get()` queries.

---

## 📋 The 5-Minute Go-Live Security Checklist

Run through this audit checklist before deploying to production:

- [ ] **API Key Locked:** Restricted in Google Cloud Console to HTTP referrers and Firebase APIs only.
- [ ] **Rules Deployed:** `firestore.rules` has Default Deny (`match /{document=**} { allow read, write: if false; }`).
- [ ] **No Admin Privileges in Document Data:** Roles checked via `request.auth.token.*`, not document fields.
- [ ] **App Check Active:** ReCAPTCHA registered and enforced on public collection writes.
- [ ] **Storage Capped:** Size limits (`< 5MB`) and MIME-types enforced in `storage.rules`.
- [ ] **Functions Capped:** `maxInstances: 10` configured on all triggers.
- [ ] **Secrets Protected:** Zero secrets in Git or frontend bundles; secrets managed via `defineSecret()`.
- [ ] **Billing Alerts Configured:** Budget notifications enabled in Google Cloud Console.
