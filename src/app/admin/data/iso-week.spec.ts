import { describe, it, expect } from 'vitest';
import { startOfIsoWeek } from './iso-week';

describe('startOfIsoWeek', () => {
  it('returns Monday midnight UTC for a Wednesday input', () => {
    // Wednesday Jan 10, 2024 15:30 UTC
    const wed = Date.UTC(2024, 0, 10, 15, 30);
    const result = startOfIsoWeek(wed);
    expect(new Date(result).toISOString()).toBe('2024-01-08T00:00:00.000Z');
  });

  it('returns the previous Monday for a Sunday input (the tricky case)', () => {
    // Sunday Jan 14, 2024 10:00 UTC — should map to Monday Jan 8
    const sun = Date.UTC(2024, 0, 14, 10, 0);
    const result = startOfIsoWeek(sun);
    expect(new Date(result).toISOString()).toBe('2024-01-08T00:00:00.000Z');
  });

  it('is idempotent — Monday midnight maps to itself', () => {
    // Monday Jan 8, 2024 00:00 UTC
    const mon = Date.UTC(2024, 0, 8, 0, 0);
    expect(startOfIsoWeek(mon)).toBe(mon);
  });

  it('result is always <= input', () => {
    const instants = [
      Date.UTC(2024, 0, 1, 0, 0),   // Monday
      Date.UTC(2024, 0, 7, 23, 59),  // Sunday late
      Date.UTC(2024, 5, 15, 22, 45), // Saturday
      Date.UTC(2024, 11, 31, 12, 0), // Tuesday
    ];
    for (const t of instants) {
      expect(startOfIsoWeek(t)).toBeLessThanOrEqual(t);
    }
  });

  it('result is always within 7 days of input', () => {
    const instants = [
      Date.UTC(2024, 0, 1, 0, 0),
      Date.UTC(2024, 0, 7, 23, 59),
      Date.UTC(2024, 5, 15, 22, 45),
      Date.UTC(2024, 11, 31, 12, 0),
    ];
    const sevenDays = 7 * 86_400_000;
    for (const t of instants) {
      const diff = t - startOfIsoWeek(t);
      expect(diff).toBeGreaterThanOrEqual(0);
      expect(diff).toBeLessThan(sevenDays);
    }
  });

  it('result day is always Monday (getUTCDay() === 1)', () => {
    const instants = [
      Date.UTC(2024, 0, 1),   // Monday
      Date.UTC(2024, 0, 2),   // Tuesday
      Date.UTC(2024, 0, 3),   // Wednesday
      Date.UTC(2024, 0, 4),   // Thursday
      Date.UTC(2024, 0, 5),   // Friday
      Date.UTC(2024, 0, 6),   // Saturday
      Date.UTC(2024, 0, 7),   // Sunday
    ];
    for (const t of instants) {
      const result = new Date(startOfIsoWeek(t));
      expect(result.getUTCDay()).toBe(1); // Monday
    }
  });

  it('result is always UTC midnight', () => {
    const instants = [
      Date.UTC(2024, 3, 15, 13, 45, 30, 500),
      Date.UTC(2024, 6, 21, 23, 59, 59, 999),
      Date.UTC(2024, 0, 1, 0, 0, 0, 1),
    ];
    for (const t of instants) {
      const result = startOfIsoWeek(t);
      expect(result % 86_400_000).toBe(0);
    }
  });

  it('handles epoch zero (Thursday Jan 1, 1970)', () => {
    // Jan 1, 1970 is a Thursday — the Monday before is Dec 29, 1969
    const result = startOfIsoWeek(0);
    expect(new Date(result).toISOString()).toBe('1969-12-29T00:00:00.000Z');
  });
});
