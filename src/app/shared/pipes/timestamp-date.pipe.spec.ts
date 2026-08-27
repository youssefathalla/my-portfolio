import { TestBed } from '@angular/core/testing';
import { TimestampDatePipe } from './timestamp-date.pipe';

describe('TimestampDatePipe', () => {
  let pipe: TimestampDatePipe;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    pipe = TestBed.runInInjectionContext(() => new TimestampDatePipe());
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('returns null for null or undefined input', () => {
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeNull();
  });

  it('converts a Firestore-like Timestamp object via toDate()', () => {
    const date = new Date('2026-01-01T00:00:00Z');
    const timestamp = { toDate: () => date };
    expect(pipe.transform(timestamp)).toBe(date);
  });

  it('returns a Date input unchanged', () => {
    const date = new Date('2026-06-15T00:00:00Z');
    expect(pipe.transform(date)).toBe(date);
  });

  it('parses a valid date string or number', () => {
    expect(pipe.transform('2026-01-01T00:00:00Z')?.getUTCFullYear()).toBe(2026);
    const millis = Date.parse('2026-06-15T00:00:00Z');
    expect(pipe.transform(millis)).toEqual(new Date(millis));
  });

  it('returns null and warns for unsupported values', () => {
    expect(pipe.transform('not a date')).toBeNull();
    expect(pipe.transform({})).toBeNull();
  });
});
