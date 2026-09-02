# Secret_Store Entries

This document lists the secrets this feature requires, the Cloud Function that consumes each, and its purpose. **This file holds zero actual secret values.**

## Production Secrets (Google Cloud Secret Manager)

| Secret Name             | Consuming Function                            | Purpose                                                                                                                              |
| ----------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `RESEND_API_KEY`        | `onSubmissionCreated` (Notification_Function) | Bearer API key for the Resend transactional email provider. Used to send notification emails to the site owner on new submissions.   |
| `NOTIFICATION_ADDRESS`  | `onSubmissionCreated` (Notification_Function) | Destination email address for notification emails. Not a credential, but stored in Secret Manager to keep it out of version control. |
| `CALCOM_WEBHOOK_SECRET` | `onCalcomWebhook` (Webhook_Function)          | Shared secret for HMAC-SHA256 verification of Cal.com webhook request signatures.                                                    |

## Local Development

| Token                           | Location                                              | Purpose                                                                                                                                                                                     |
| ------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FIREBASE_APPCHECK_DEBUG_TOKEN` | `.env.local` or equivalent (never version-controlled) | App Check debug token permitting Emulator Suite writes without a production reCAPTCHA v3 registration. Supplied as a module-level constant read by `FirebaseAppService.activateAppCheck()`. |

## Deployment

Populate secrets before first deploy:

```sh
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:set NOTIFICATION_ADDRESS
firebase functions:secrets:set CALCOM_WEBHOOK_SECRET
```
