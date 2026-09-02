/**
 * Cloud Functions entry point.
 *
 * Re-exports all Cloud Function triggers for this Firebase project.
 * Each function is implemented in its own module and re-exported here
 * so the Firebase CLI discovers them at deploy time.
 */

// Notification_Function — triggered on new submission document creation
export { onSubmissionCreated } from './notification-function';

// Webhook_Function — HTTPS endpoint for Cal.com booking webhooks
export { onCalcomWebhook } from './webhook-function';
