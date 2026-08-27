// Interface matching Firestore Timestamp
export interface FirestoreTimestamp {
  toDate(): Date;
}

/**
 * Formats a Date object or string into a HH:mm time string.
 * @param time Date object or string
 * @returns Time string in 'HH:mm' format
 */
export function formatTime(time: Date | string): string {
  if (typeof time === 'string') return time;
  return time.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Parses a time string (HH:mm) into a Date object for today.
 * If the input is already a Date, returns it as is.
 * @param time Time string 'HH:mm' or Date object
 * @returns Date object with the time set
 */
export function parseTime(time: string | Date): Date {
  if (time instanceof Date) return time;
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}
