import { Pipe, PipeTransform } from '@angular/core';
import { FirestoreTimestamp } from '@shared/utils/date.utils';

@Pipe({ name: 'timestampDate' })
export class TimestampDatePipe implements PipeTransform {
  transform(value: unknown): Date | null {
    // Guard against null or undefined values
    if (!value) return null;

    // Check if the value is a valid Firestore Timestamp object by looking for the toDate method
    if (value && typeof (value as FirestoreTimestamp).toDate === 'function') {
      return (value as FirestoreTimestamp).toDate();
    }

    // Check if the value is already a Date object
    if (value instanceof Date) return value;

    // Fallback for string or number inputs
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date;
    }

    // If it's neither a Timestamp nor a Date, log a warning in development
    console.warn(
      'TimestampDatePipe received a value that was not a Firestore Timestamp, Date, or valid string/number:',
      value,
    );
    return null;
  }
}
