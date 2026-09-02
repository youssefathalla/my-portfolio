import { Service } from '@angular/core';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import { isBrowser } from '../platform/platform';
import { environment } from '@env/environment';

/** Container holding shared FirebaseApp and Firestore database instances. */
export interface FirebaseHandles {
  readonly app: FirebaseApp;
  readonly db: Firestore;
}

/** Optional development debug token for App Check. */
declare const FIREBASE_APPCHECK_DEBUG_TOKEN: string | undefined;

/** Initializes Firebase client SDK and manages Firestore handles with timeout and App Check protection. */
@Service()
export class FirebaseAppService {
  private readonly isBrowserContext = isBrowser();
  private handlePromise: Promise<FirebaseHandles | null> | null = null;
  private appCheckWarningLogged = false;

  /** Returns the Firestore database instance or null if unavailable. */
  getFirestore(): Promise<Firestore | null> {
    return this.handles().then((h) => h?.db ?? null);
  }

  /** Returns the FirebaseApp instance or null if unavailable. */
  getApp(): Promise<FirebaseApp | null> {
    return this.handles().then((h) => h?.app ?? null);
  }

  /** Lazily initializes and returns shared Firebase handles. Returns null in non-browser or unconfigured contexts. */
  private handles(): Promise<FirebaseHandles | null> {
    if (!this.isBrowserContext) {
      return Promise.resolve(null);
    }
    if (this.isUnconfigured()) {
      return Promise.resolve(null);
    }
    this.handlePromise ??= this.initializeWithTimeout();
    return this.handlePromise;
  }

  /** Checks if any essential Firebase configuration field is missing or empty. */
  private isUnconfigured(): boolean {
    const { apiKey, authDomain, projectId, appId } = environment.firebase;
    return [apiKey, authDomain, projectId, appId].some((v) => v.trim().length === 0);
  }

  /** Races initialization against a 10s timeout, safely returning null on failure without throwing. */
  private async initializeWithTimeout(): Promise<FirebaseHandles | null> {
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000));
    try {
      return await Promise.race([this.initialize(), timeout]);
    } catch {
      return null;
    }
  }

  /** Dynamically imports Firebase modules, initializes the app, activates App Check, and attaches emulators if enabled. */
  private async initialize(): Promise<FirebaseHandles> {
    const [{ initializeApp }, { getFirestore, connectFirestoreEmulator }] = await Promise.all([
      import('firebase/app'),
      import('firebase/firestore'),
    ]);
    const app = initializeApp(environment.firebase);
    await this.activateAppCheck(app);
    const db = getFirestore(app);

    if (
      typeof window !== 'undefined' &&
      (window as unknown as Record<string, unknown>)['__FIREBASE_EMULATOR_HOST__']
    ) {
      connectFirestoreEmulator(db, 'localhost', 8180);
    }
    return { app, db };
  }

  /** Activates App Check using debug tokens, reCAPTCHA v3, or falls back to an unconfigured warning. */
  private async activateAppCheck(app: FirebaseApp): Promise<void> {
    const { initializeAppCheck, CustomProvider, ReCaptchaV3Provider } =
      await import('firebase/app-check');

    // Debug token for local development with emulator
    const debugToken =
      typeof FIREBASE_APPCHECK_DEBUG_TOKEN !== 'undefined' ? FIREBASE_APPCHECK_DEBUG_TOKEN : undefined;

    if (debugToken !== undefined && debugToken.length > 0) {
      const provider = new CustomProvider({
        getToken: () =>
          Promise.resolve({
            token: debugToken,
            expireTimeMillis: Date.now() + 3_600_000,
          }),
      });
      initializeAppCheck(app, { provider, isTokenAutoRefreshEnabled: true });
      return;
    }

    // Blank site key check
    if (environment.appCheckSiteKey.trim().length === 0) {
      if (!this.appCheckWarningLogged) {
        console.warn(
          '[firebase-backend] appCheckSiteKey is blank; Firestore is disabled for this session (R9.9).',
        );
        this.appCheckWarningLogged = true;
      }
      throw new Error('app-check-unconfigured');
    }

    // Production reCAPTCHA v3 provider
    const provider = new ReCaptchaV3Provider(environment.appCheckSiteKey);
    initializeAppCheck(app, { provider, isTokenAutoRefreshEnabled: true });
  }
}
