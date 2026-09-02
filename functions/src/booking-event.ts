/**
 * Booking_Event parser and serializer.
 *
 * Pure, total functions (never throw) for converting between a raw Cal.com
 * webhook request body string and the internal BookingEvent representation.
 * Zero I/O, zero dependency on the current time, zero Angular imports.
 *
 * Feature: firebase-backend
 * Requirements: R12.5, R12.6
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BookingEvent {
  readonly trigger: string;
  readonly invitee: { readonly name: string; readonly email: string };
  readonly eventTypeSlug: string;
  readonly startTime: string; // ISO 8601, explicit UTC offset
  readonly timezone: string;
  readonly rescheduleUrl: string;
  readonly bookingReference: string;
  readonly eventTimestamp: Date;
}

export type ParseResult =
  | { readonly ok: true; readonly value: BookingEvent }
  | { readonly ok: false; readonly error: string };

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Pure, total: returns either exactly one BookingEvent or exactly one
 * descriptive parse failure for every input string (R12.5).
 *
 * Maps the Cal.com webhook request body shape:
 *   triggerEvent        → trigger
 *   createdAt           → eventTimestamp (parsed to Date)
 *   payload.uid         → bookingReference
 *   payload.type        → eventTypeSlug (Cal.com sends the event type slug as
 *                          a flat string field named `type`, not a nested
 *                          `eventType.slug` object — see the official example
 *                          payload at cal.com/docs/core-features/webhooks)
 *   payload.startTime   → startTime
 *   payload.attendees[0].name    → invitee.name
 *   payload.attendees[0].email   → invitee.email
 *   payload.attendees[0].timeZone → timezone
 *   payload.rescheduleUrl        → rescheduleUrl
 */
export function parseBookingEvent(rawBody: string): ParseResult {
  // Step 1: Parse JSON safely
  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return { ok: false, error: 'Invalid JSON: unable to parse request body' };
  }

  // Step 2: Validate top-level shape
  if (json === null || typeof json !== 'object' || Array.isArray(json)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const body = json as Record<string, unknown>;

  // Step 3: Extract and validate triggerEvent
  if (typeof body['triggerEvent'] !== 'string' || body['triggerEvent'].length === 0) {
    return {
      ok: false,
      error: 'Missing or invalid field: triggerEvent (expected non-empty string)',
    };
  }
  const trigger = body['triggerEvent'];

  // Step 4: Extract and validate createdAt → eventTimestamp
  if (typeof body['createdAt'] !== 'string' || body['createdAt'].length === 0) {
    return { ok: false, error: 'Missing or invalid field: createdAt (expected non-empty string)' };
  }
  const eventTimestamp = new Date(body['createdAt']);
  if (Number.isNaN(eventTimestamp.getTime())) {
    return { ok: false, error: 'Invalid field: createdAt (not a valid ISO 8601 date)' };
  }

  // Step 5: Validate payload exists and is an object
  if (
    body['payload'] === null ||
    typeof body['payload'] !== 'object' ||
    Array.isArray(body['payload'])
  ) {
    return { ok: false, error: 'Missing or invalid field: payload (expected object)' };
  }
  const payload = body['payload'] as Record<string, unknown>;

  // Step 6: Extract payload.uid → bookingReference
  if (typeof payload['uid'] !== 'string' || payload['uid'].length === 0) {
    return {
      ok: false,
      error: 'Missing or invalid field: payload.uid (expected non-empty string)',
    };
  }
  const bookingReference = payload['uid'];

  // Step 7: Extract payload.type → eventTypeSlug (the event type slug is sent
  // as a flat string field, not nested under an `eventType` object)
  if (typeof payload['type'] !== 'string' || payload['type'].length === 0) {
    return {
      ok: false,
      error: 'Missing or invalid field: payload.type (expected non-empty string)',
    };
  }
  const eventTypeSlug = payload['type'];

  // Step 8: Extract payload.startTime
  if (typeof payload['startTime'] !== 'string' || payload['startTime'].length === 0) {
    return {
      ok: false,
      error: 'Missing or invalid field: payload.startTime (expected non-empty string)',
    };
  }
  const startTime = payload['startTime'];

  // Step 9: Extract payload.attendees[0]
  if (!Array.isArray(payload['attendees']) || payload['attendees'].length === 0) {
    return {
      ok: false,
      error: 'Missing or invalid field: payload.attendees (expected non-empty array)',
    };
  }
  const attendee = payload['attendees'][0];
  if (attendee === null || typeof attendee !== 'object' || Array.isArray(attendee)) {
    return { ok: false, error: 'Invalid field: payload.attendees[0] (expected object)' };
  }
  const att = attendee as Record<string, unknown>;

  if (typeof att['name'] !== 'string' || att['name'].length === 0) {
    return {
      ok: false,
      error: 'Missing or invalid field: payload.attendees[0].name (expected non-empty string)',
    };
  }
  const inviteeName = att['name'];

  if (typeof att['email'] !== 'string' || att['email'].length === 0) {
    return {
      ok: false,
      error: 'Missing or invalid field: payload.attendees[0].email (expected non-empty string)',
    };
  }
  const inviteeEmail = att['email'];

  if (typeof att['timeZone'] !== 'string' || att['timeZone'].length === 0) {
    return {
      ok: false,
      error: 'Missing or invalid field: payload.attendees[0].timeZone (expected non-empty string)',
    };
  }
  const timezone = att['timeZone'];

  // Step 10: Extract payload.rescheduleUrl — optional. Cal.com's real webhook
  // payload does not include this field for regular (non-platform) bookings;
  // only `platformRescheduleUrl` exists, and only for platform/managed
  // bookings. Defaults to '' rather than rejecting the event, since nothing
  // downstream requires a non-empty value.
  const rescheduleUrl = typeof payload['rescheduleUrl'] === 'string' ? payload['rescheduleUrl'] : '';

  // All fields validated — assemble the BookingEvent
  return {
    ok: true,
    value: {
      trigger,
      invitee: { name: inviteeName, email: inviteeEmail },
      eventTypeSlug,
      startTime,
      timezone,
      rescheduleUrl,
      bookingReference,
      eventTimestamp,
    },
  };
}

// ---------------------------------------------------------------------------
// Serializer
// ---------------------------------------------------------------------------

/**
 * Pure inverse: renders a BookingEvent back into the Cal.com request-body
 * shape as a plain object. The round-trip invariant holds:
 *   parseBookingEvent(JSON.stringify(serializeBookingEvent(event)))
 * reproduces the original BookingEvent (R12.6).
 */
export function serializeBookingEvent(event: BookingEvent): Record<string, unknown> {
  return {
    triggerEvent: event.trigger,
    createdAt: event.eventTimestamp.toISOString(),
    payload: {
      uid: event.bookingReference,
      type: event.eventTypeSlug,
      startTime: event.startTime,
      attendees: [
        {
          name: event.invitee.name,
          email: event.invitee.email,
          timeZone: event.timezone,
        },
      ],
      rescheduleUrl: event.rescheduleUrl,
    },
  };
}
