/** Minimal Firestore Timestamp interface shape. */
export interface FirestoreTimestamp {
  toDate(): Date;
}

/** Formats a Date or string into an HH:mm time string. */
export function formatTime(time: Date | string): string {
  if (typeof time === 'string') return time;
  return time.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Parses an HH:mm time string into a today Date object. */
export function parseTime(time: string | Date): Date {
  if (time instanceof Date) return time;
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}
