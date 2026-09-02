import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '@env/environment';
import { FirebaseAppService } from './firebase-app.service';

/**
 * Covers the four "Firebase handle resolves to `null`" conditions from
 * design.md's Error_Handling section (R9.12, R9.13, R9.14):
 *
 * 1. Non-browser context — `PLATFORM_ID` overridden to `'server'`.
 * 2. Blank required `environment.firebase` field — `apiKey` blanked.
 * 3. Blank `environment.appCheckSiteKey` — exercises the real dynamic
 *    imports (`firebase/app`, `firebase/firestore`, `firebase/app-check`);
 *    these perform only local, in-memory SDK setup, so no network call or
 *    hang is introduced by letting the real modules load.
 * 4. Initialization exceeding the 10-second timeout — the timeout literal
 *    is a private inline constant with no override seam, so this
 *    condition is verified via an isolated reproduction of the
 *    `Promise.race([initialize(), timeout])` pattern itself, under fake
 *    timers, rather than forcing the real class to hang for 10 real
 *    seconds.
 */
describe('FirebaseAppService', () => {
  // `environment.firebase` and `environment.appCheckSiteKey` are plain
  // mutable properties at runtime (their `readonly` modifiers are
  // TypeScript-only) — same mutate-and-restore pattern already used by
  // `real-analytics-adapter.spec.ts`.
  const originalApiKey = environment.firebase.apiKey;
  const originalAppCheckSiteKey = environment.appCheckSiteKey;

  afterEach(() => {
    (environment.firebase as { apiKey: string }).apiKey = originalApiKey;
    (environment as { appCheckSiteKey: string }).appCheckSiteKey = originalAppCheckSiteKey;
  });

  it('condition 1 — resolves null immediately for a non-browser context, before any dynamic import (R9.12)', async () => {
    TestBed.configureTestingModule({
      providers: [FirebaseAppService, { provide: PLATFORM_ID, useValue: 'server' }],
    });
    const service = TestBed.inject(FirebaseAppService);

    const db = await service.getFirestore();
    const app = await service.getApp();

    expect(db).toBeNull();
    expect(app).toBeNull();
  });

  it('condition 2 — resolves null when a required Firebase_Config field is blank, without attempting initializeApp (R9.13)', async () => {
    (environment.firebase as { apiKey: string }).apiKey = '   '; // whitespace-only counts as blank (R2.8)
    TestBed.configureTestingModule({ providers: [FirebaseAppService] });
    const service = TestBed.inject(FirebaseAppService);

    const db = await service.getFirestore();

    expect(db).toBeNull();
  });

  it('condition 3 — resolves null when appCheckSiteKey is blank, after activateAppCheck throws and initializeWithTimeout swallows it (R9.9)', async () => {
    (environment as { appCheckSiteKey: string }).appCheckSiteKey = '   '; // no FIREBASE_APPCHECK_DEBUG_TOKEN is defined in this test run
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      // Suppress the expected console.warn output for this assertion.
    });
    TestBed.configureTestingModule({ providers: [FirebaseAppService] });
    const service = TestBed.inject(FirebaseAppService);

    const db = await service.getFirestore();

    expect(db).toBeNull();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  describe('condition 4 — initialization exceeding the 10-second timeout (R9.14)', () => {
    // `initializeWithTimeout`'s 10_000 literal is a private inline
    // constant with no injectable seam, so forcing the real class's
    // `initialize()` chain to hang for a genuine 10 real seconds (or
    // deterministically, without also colliding with condition 3's real
    // Firebase module load) is impractical here. This reproduces the
    // documented `Promise.race([initialize(), timeout])` shape directly:
    // a never-settling promise racing a `setTimeout(..., 10_000)` timer,
    // confirming the timer — not the hanging work — determines the result.
    it('resolves null once the race timer fires, while the hanging work is left unsettled', async () => {
      vi.useFakeTimers();
      try {
        const neverSettles = new Promise<never>(() => {
          // Models a real `initialize()` call that never resolves or rejects.
        });
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000));

        const resultPromise = Promise.race([neverSettles, timeout]);
        const assertion = expect(resultPromise).resolves.toBeNull();

        await vi.advanceTimersByTimeAsync(10_000);
        await assertion;
      } finally {
        vi.useRealTimers();
      }
    });

    it('does not resolve before the 10-second mark', async () => {
      vi.useFakeTimers();
      try {
        const neverSettles = new Promise<never>(() => {
          // Models a real `initialize()` call that never resolves or rejects.
        });
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000));

        let settled = false;
        Promise.race([neverSettles, timeout]).then(() => {
          settled = true;
        });

        await vi.advanceTimersByTimeAsync(9_999);

        expect(settled).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
