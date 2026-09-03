/**
 * Notification_Function — Cloud Function triggered on Submission_Document creation.
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { classifySpam } from './spam-heuristic';
import { recordRateLimitedSend } from './rate-limit';

const MAIL_CREDENTIAL = defineSecret('RESEND_API_KEY');
const NOTIFICATION_ADDRESS = defineSecret('NOTIFICATION_ADDRESS');

if (getApps().length === 0) {
  initializeApp();
}

async function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('transaction-deadline')), ms);
  });
  try {
    return await Promise.race([promise, deadline]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export const onSubmissionCreated = onDocumentCreated(
  {
    document: 'submissions/{submissionId}',
    region: 'europe-west1',
    secrets: [MAIL_CREDENTIAL, NOTIFICATION_ADDRESS],
    timeoutSeconds: 60,
    maxInstances: 10,
  },
  async (event) => {
    const db = getFirestore();
    const snap = event.data;
    if (!snap) return;

    const submissionId = event.params.submissionId;
    const doc = snap.data() as Record<string, unknown>;
    const docType = doc['type'] as string | undefined;

    const mailCredential = MAIL_CREDENTIAL.value();
    const notificationAddress = NOTIFICATION_ADDRESS.value();
    if (!mailCredential) {
      console.error('[notification-function] absent Secret_Store entry: RESEND_API_KEY');
      return;
    }
    if (!notificationAddress) {
      console.error('[notification-function] absent Secret_Store entry: NOTIFICATION_ADDRESS');
      return;
    }

    const ledgerRef = db.collection('_notificationLedger').doc(submissionId);
    const counterRef = db.collection('_rateLimitCounters').doc('notificationFunction');

    let shouldSend = false;

    try {
      await withDeadline(
        db.runTransaction(async (tx) => {
          const ledgerSnap = await tx.get(ledgerRef);
          if (ledgerSnap.exists) {
            shouldSend = false;
            return;
          }

          if (docType === 'contact' || docType === 'intake-wizard') {
            const classification = classifySpam(
              doc['payload'] as Record<string, string | number | boolean>,
            );
            if (classification === 'spam') {
              tx.update(snap.ref, {
                status: 'spam',
                updatedAt: FieldValue.serverTimestamp(),
              });
              tx.set(ledgerRef, { attemptedAt: FieldValue.serverTimestamp(), sent: false });
              shouldSend = false;
              return;
            }
          }

          const withinLimit = await recordRateLimitedSend(tx, counterRef);
          tx.set(ledgerRef, { attemptedAt: FieldValue.serverTimestamp(), sent: withinLimit });

          if (!withinLimit) {
            console.warn(
              `[notification-function] rate-limited, suppressed send for ${submissionId}`,
            );
          }

          shouldSend = withinLimit;
        }),
        10_000,
      );
    } catch (err) {
      console.error(
        `[notification-function] transaction failed for ${submissionId}:`,
        (err as Error).message,
      );
      return;
    }

    if (!shouldSend) return;

    await sendNotificationEmail(submissionId, doc, mailCredential, notificationAddress);
  },
);

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function toIsoUtc(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

function isUpperChar(char: string | undefined): boolean {
  return char !== undefined && char >= 'A' && char <= 'Z';
}

function isLowerChar(char: string | undefined): boolean {
  return char !== undefined && char >= 'a' && char <= 'z';
}

function isDigitChar(char: string | undefined): boolean {
  return char !== undefined && char >= '0' && char <= '9';
}

/** `true` when a word boundary belongs immediately before `key[i]` — a lower-to-upper transition or an acronym-to-word transition (e.g. `HTMLParser` → `HTML|Parser`). */
function isWordBoundary(key: string, i: number): boolean {
  if (i === 0) return false;
  const char = key[i];
  if (!isUpperChar(char)) return false;

  const prev = key[i - 1];
  const next = key[i + 1];
  return isLowerChar(prev) || isDigitChar(prev) || (isUpperChar(prev) && isLowerChar(next));
}

/**
 * Converts a camelCase payload key into a spaced, title-cased label —
 * e.g. `inviteeEmail` → `Invitee Email`, `bookingReference` → `Booking
 * Reference`. Splits on lower-to-upper transitions and acronym boundaries
 * (e.g. `eventTypeSlug` → `Event Type Slug`) with a single linear pass over
 * the string — no regex backtracking, so runtime stays linear even on
 * adversarial input (the key ultimately derives from user-submitted form
 * field names).
 */
function formatFieldLabel(key: string): string {
  let result = '';
  let capitalizeNext = true;

  for (let i = 0; i < key.length; i++) {
    const char = key[i];
    if (!isUpperChar(char) && !isLowerChar(char) && !isDigitChar(char)) {
      continue;
    }

    if (isWordBoundary(key, i)) {
      result += ' ';
      capitalizeNext = true;
    }

    result += capitalizeNext ? char.toUpperCase() : char;
    capitalizeNext = false;
  }

  return result;
}

/** Extracts `doc['type']` as a string, falling back when it is absent or not a string. */
function getDocType(doc: Record<string, unknown>, fallback: string): string {
  const value = doc['type'];
  return typeof value === 'string' ? value : fallback;
}

/** Human-readable header label for a Submission_Document's type, including its emoji. */
function getTypeLabel(docType: string): string {
  if (docType === 'contact') return '📩 Contact Form';
  if (docType === 'intake-wizard') return '📋 Intake Wizard';
  if (docType === 'booking') return '📅 Booking';
  return `📨 ${docType}`;
}

/** Header background color for a Submission_Document's type. */
function getTypeColor(docType: string): string {
  if (docType === 'contact') return '#2563eb';
  if (docType === 'intake-wizard') return '#7c3aed';
  return '#059669';
}

/** Subject-line emoji for a Submission_Document's type. */
function getTypeEmoji(docType: string): string {
  if (docType === 'contact') return '📩';
  if (docType === 'intake-wizard') return '📋';
  return '📅';
}

/** Renders a payload value for the email table, coercing non-primitives to a readable string. */
function formatFieldValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null || value === undefined) return '';
  return JSON.stringify(value);
}

function renderNotificationEmail(submissionId: string, doc: Record<string, unknown>): string {
  const docType = escapeHtml(getDocType(doc, ''));
  const escapedId = escapeHtml(submissionId);
  const createdAt = toIsoUtc(doc['createdAt']);
  const payload = (doc['payload'] ?? {}) as Record<string, unknown>;

  const rows = Object.entries(payload)
    .map(
      ([key, value]) =>
        `<tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; width: 140px;">${escapeHtml(formatFieldLabel(key))}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #111827;">${escapeHtml(formatFieldValue(value))}</td>
        </tr>`,
    )
    .join('');

  const typeLabel = getTypeLabel(docType);
  const typeColor = getTypeColor(docType);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background: ${typeColor}; padding: 24px 32px;">
      <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">${typeLabel}</h1>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">New submission received</p>
    </div>

    <!-- Meta -->
    <div style="padding: 20px 32px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
      <table style="width: 100%; font-size: 13px; color: #6b7280;">
        <tr>
          <td><strong>ID:</strong> ${escapedId}</td>
          <td style="text-align: right;"><strong>Received:</strong> ${escapeHtml(createdAt)}</td>
        </tr>
      </table>
    </div>

    <!-- Payload Table -->
    <div style="padding: 24px 32px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 10px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Field</th>
            <th style="padding: 10px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Value</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">youssefathalla.com &mdash; Automated notification</p>
    </div>

  </div>
</body>
</html>`;
}

async function sendNotificationEmail(
  submissionId: string,
  doc: Record<string, unknown>,
  mailCredential: string,
  notificationAddress: string,
): Promise<void> {
  const docType = getDocType(doc, 'unknown');
  const html = renderNotificationEmail(submissionId, doc);

  const typeEmoji = getTypeEmoji(docType);
  const subject = `${typeEmoji} New ${docType} submission`;

  try {
    const response = await withDeadline(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mailCredential}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: '💰 Work <work@youssefathalla.com>',
          to: [notificationAddress],
          subject,
          html,
        }),
      }),
      30_000,
    );

    if (!response.ok) {
      console.error(
        `[notification-function] mail provider rejected send for ${submissionId}: ${response.status}`,
      );
    }
  } catch (err) {
    console.error(
      `[notification-function] mail provider failed for ${submissionId}:`,
      (err as Error).message,
    );
  }
}
