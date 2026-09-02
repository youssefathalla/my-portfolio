import type { Transaction, DocumentReference } from 'firebase-admin/firestore';

interface RateLimitCounter {
  sendTimestamps: number[]; // Unix millis of each send
}

/**
 * Records one rate-limited send inside the caller's transaction.
 *
 * Reads the Rate_Limit_Counter document, filters timestamps to the trailing
 * 60-minute window, and either:
 * - Returns `true` and records a new timestamp if fewer than 20 sends remain in the window
 * - Returns `false` (writing nothing) if the rate limit is exceeded
 *
 * MUST be called inside a Firestore transaction (the `tx` parameter).
 */
export async function recordRateLimitedSend(
  tx: Transaction,
  counterRef: DocumentReference,
  now?: number, // for testing — defaults to Date.now()
): Promise<boolean> {
  const currentTime = now ?? Date.now();
  const windowStart = currentTime - 60 * 60 * 1000; // 60 minutes ago

  const snap = await tx.get(counterRef);
  const data = snap.data() as RateLimitCounter | undefined;
  const existingTimestamps = data?.sendTimestamps ?? [];

  // Filter to trailing 60-minute window
  const activeTimestamps = existingTimestamps.filter(ts => ts > windowStart);

  // Rate limit: max 20 sends per 60-minute window
  if (activeTimestamps.length >= 20) {
    return false;
  }

  // Record the new timestamp
  tx.set(counterRef, { sendTimestamps: [...activeTimestamps, currentTime] });
  return true;
}
