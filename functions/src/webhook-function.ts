/**
 * Cal.com Webhook Bridge — HTTPS Cloud Function.
 *
 * Receives Cal.com booking webhook requests, verifies their signature and
 * freshness, parses the booking event, and bridges it into the Submissions
 * collection as a `booking` Submission_Document.
 *
 * Feature: firebase-backend
 * Requirements: R12.1, R12.2, R12.3, R12.7, R12.8, R12.9, R12.10, R12.11,
 *               R12.12, R12.15, R12.16, R12.17
 */

import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as crypto from 'node:crypto';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { parseBookingEvent } from './booking-event';
import type { BookingEvent } from './booking-event';

const CALCOM_WEBHOOK_SECRET = defineSecret('CALCOM_WEBHOOK_SECRET');

const MAX_BODY_BYTES = 65_536; // R12.1
const MAX_CLOCK_SKEW_MS = 300_000; // 300 seconds — R12.15

if (getApps().length === 0) initializeApp();

// ---------------------------------------------------------------------------
// Signature verification (R12.2, R12.4)
// ---------------------------------------------------------------------------

/**
 * Computes the expected HMAC-SHA256 signature over the raw request body and
 * compares it to the received signature header in constant time.
 *
 * `crypto.timingSafeEqual` throws on mismatched buffer lengths rather than
 * returning `false`, so a length-equality check runs first — that check itself
 * costs the same regardless of content, leaking nothing beyond the fixed length
 * of an already-public hex-digest format (R12.4).
 */
export function verifySignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');
  const signatureBuf = Buffer.from(signatureHeader, 'utf8');

  // Length-equality check first — timingSafeEqual throws on mismatched lengths
  if (expectedBuf.length !== signatureBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

// ---------------------------------------------------------------------------
// Freshness check (R12.15)
// ---------------------------------------------------------------------------

/**
 * Replay protection: rejects any event whose own emission timestamp drifts
 * more than 300 seconds from server time, even if the signature verifies.
 */
export function isFresh(eventTimestamp: Date): boolean {
  const now = Date.now();
  const drift = Math.abs(now - eventTimestamp.getTime());
  return drift <= MAX_CLOCK_SKEW_MS;
}

// ---------------------------------------------------------------------------
// Booking_Reference lookup (R12.17)
// ---------------------------------------------------------------------------

/**
 * Locates the existing Submission_Document for a given Booking_Reference.
 *
 * Issues exactly one Firestore query filtering on `type == 'booking'` and
 * `payload.bookingReference == bookingReference`, requests at most 1 result,
 * and relies on the composite index declared in `firestore.indexes.json` (R1.3).
 *
 * Returns the matched document snapshot or `null` when no match exists.
 */
async function findByBookingReference(
  db: FirebaseFirestore.Firestore,
  bookingReference: string,
): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> {
  const snapshot = await db
    .collection('submissions')
    .where('type', '==', 'booking')
    .where('payload.bookingReference', '==', bookingReference)
    .limit(1)
    .get();
  return snapshot.docs[0] ?? null;
}

// ---------------------------------------------------------------------------
// Booking document/payload builders (R5.9, R12.7)
// ---------------------------------------------------------------------------

/**
 * Builds the seven-entry `booking` Submission_Payload from a BookingEvent.
 *
 * Entries: bookingReference, trigger, inviteeName, inviteeEmail,
 * eventTypeSlug, startTime, timezone (R5.9).
 */
function buildBookingPayload(event: BookingEvent): Record<string, string> {
  return {
    bookingReference: event.bookingReference,
    trigger: event.trigger,
    inviteeName: event.invitee.name,
    inviteeEmail: event.invitee.email,
    eventTypeSlug: event.eventTypeSlug,
    startTime: event.startTime,
    timezone: event.timezone,
  };
}

/**
 * Assembles the eight-field Submission_Document for a new booking (R12.7).
 *
 * Uses `FieldValue.serverTimestamp()` for `createdAt` and `updatedAt` so
 * zero client-supplied clock values are sent (R6.2 equivalent for server-side).
 */
function buildBookingDocument(event: BookingEvent): Record<string, unknown> {
  return {
    type: 'booking',
    status: 'new',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    read: false,
    payload: buildBookingPayload(event),
    notes: '',
    tags: [],
  };
}

// ---------------------------------------------------------------------------
// Booking event handler (R12.7–R12.12)
// ---------------------------------------------------------------------------

/**
 * Dispatches a verified BookingEvent to the appropriate Firestore operation:
 *
 * - BOOKING_CREATED: create if no existing match (R12.7, R12.12)
 * - BOOKING_RESCHEDULED: replace payload + reset status if match exists,
 *   otherwise create (R12.8, R12.9)
 * - BOOKING_CANCELLED: set status to 'archived' if match exists (R12.10)
 * - default: log and ignore, zero Firestore write (R12.11)
 */
async function handleBookingEvent(event: BookingEvent): Promise<void> {
  const db = getFirestore();
  const submissions = db.collection('submissions');
  const existing = await findByBookingReference(db, event.bookingReference);

  switch (event.trigger) {
    case 'BOOKING_CREATED':
      // R12.7: create exactly one Submission_Document if no existing match
      // R12.12: a redelivered BOOKING_CREATED finds the just-created document and writes nothing further
      if (!existing) {
        await submissions.add(buildBookingDocument(event));
      }
      return;

    case 'BOOKING_RESCHEDULED':
      if (existing) {
        // R12.8: replace payload, set status to 'new', update updatedAt — zero other fields
        await existing.ref.update({
          payload: buildBookingPayload(event),
          status: 'new',
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        // R12.9: no existing match — create a new document
        await submissions.add(buildBookingDocument(event));
      }
      return;

    case 'BOOKING_CANCELLED':
      // R12.10: set status to 'archived' if match exists — zero other fields besides updatedAt
      if (existing) {
        await existing.ref.update({
          status: 'archived',
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      return;

    default:
      // R12.11: unrecognized trigger — log and ignore, zero Firestore write, still responds 200
      console.log(`[webhook-function] ignored event: ${event.trigger}`);
      return;
  }
}

// ---------------------------------------------------------------------------
// HTTPS Cloud Function entry point (R12.1, R12.2, R12.3, R12.15, R12.16)
// ---------------------------------------------------------------------------

export const onCalcomWebhook = onRequest(
  {
    region: 'europe-west1',
    secrets: [CALCOM_WEBHOOK_SECRET],
    timeoutSeconds: 60,
    maxInstances: 10,
  },
  async (req, res) => {
    // Method guard: only POST allowed (R12.1)
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // Body size guard: > 65536 bytes → 413, before signature verification (R12.1)
    const rawBody = req.rawBody?.toString('utf8') ?? '';
    if (rawBody.length > MAX_BODY_BYTES) {
      res.status(413).send('Payload Too Large');
      return;
    }

    // Secret_Store entry guard (R13.5)
    const webhookSecret = CALCOM_WEBHOOK_SECRET.value();
    if (!webhookSecret) {
      console.error('[webhook-function] absent Secret_Store entry: CALCOM_WEBHOOK_SECRET');
      res.status(500).send('Internal Server Error');
      return;
    }

    // Signature verification (R12.2, R12.3)
    // Cal.com sends the HMAC in the `X-Cal-Signature-256` header (Node lowercases
    // incoming header names to `x-cal-signature-256`) — see calcom/cal.com's own
    // WebhookService.ts, which sets this exact header on every outgoing webhook.
    const signature = (req.headers['x-cal-signature-256'] as string | undefined) ?? '';
    if (!signature || !verifySignature(rawBody, signature, webhookSecret)) {
      console.warn('[webhook-function] rejected: signature verification failed');
      res.status(401).send('Unauthorized');
      return;
    }

    // Parse the booking event (R12.5, R12.16)
    const parseResult = parseBookingEvent(rawBody);
    if (!parseResult.ok) {
      console.warn(`[webhook-function] rejected: ${parseResult.error}`);
      res.status(400).send(parseResult.error);
      return;
    }

    // Freshness check (R12.15)
    if (!isFresh(parseResult.value.eventTimestamp)) {
      const skewSeconds = Math.round(
        Math.abs(Date.now() - parseResult.value.eventTimestamp.getTime()) / 1000,
      );
      console.warn(`[webhook-function] rejected: stale event, ${skewSeconds}s skew`);
      res.status(401).send('Stale request');
      return;
    }

    // Handle the booking event (R12.7–R12.12)
    await handleBookingEvent(parseResult.value);
    res.status(200).send('OK');
  },
);
