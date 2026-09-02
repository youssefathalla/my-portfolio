import { DatePipe } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

/**
 * R5.15 — the admin route group renders outside both locale route groups,
 * so its one `DatePipe` invocation (`submissions-list-page.html`, `row.createdAtMs | date: 'short'`)
 * resolves the ROOT `LOCALE_ID`. The merged app supplies zero root `LOCALE_ID`
 * override, so that root token falls back to Angular's built-in default: `'en-US'`.
 *
 * These tests confirm that premise directly, without any custom provider.
 */
describe('Admin DatePipe locale (R5.15)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it("resolves LOCALE_ID to 'en-US' by default with zero custom provider", () => {
    const locale = TestBed.inject(LOCALE_ID);
    expect(locale).toBe('en-US');
  });

  it("renders a 'short' DatePipe transform under the en-US default locale with ASCII digits only", () => {
    const pipe = TestBed.runInInjectionContext(() => new DatePipe(TestBed.inject(LOCALE_ID)));
    const epochMs = new Date('2025-01-15T13:45:00Z').getTime();

    const formatted = pipe.transform(epochMs, 'short');

    // ICU may separate the time from the AM/PM marker with a regular space
    // or a narrow no-break space (U+202F) depending on the ICU data version.
    expect(formatted).toMatch(/^\d{1,2}\/\d{1,2}\/\d{2,4}, \d{1,2}:\d{2}[ \u202f](AM|PM)$/);

    // No Eastern Arabic digits (U+0660–U+0669 or U+06F0–U+06F9) — confirms
    // the output is genuinely en-US, not an Arabic-locale numeral rendering.
    expect(formatted).not.toMatch(/[\u0660-\u0669\u06F0-\u06F9]/);
  });
});
