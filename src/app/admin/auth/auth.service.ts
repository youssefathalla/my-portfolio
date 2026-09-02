/**
 * Admin authentication service handling Google popup sign-in, token claims verification,
 * and session state management via signals.
 */

import { Service, Signal, inject, signal } from '@angular/core';

import { FirebaseAppService } from '../../core/firebase/firebase-app.service';
import { isBrowser } from '../../core/platform/platform';
import { AuthError, AuthState, UNAUTHENTICATED, normalizeAuthError } from './auth-state';

import type { Auth, User } from 'firebase/auth';

/** Timeout ceiling for sign-in attempts (10 seconds). */
const SIGN_IN_TIMEOUT_MS = 10_000;

/** Checks whether the session is running against a local Firebase Auth emulator. */
function isEmulatorSession(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!(window as unknown as Record<string, unknown>)['__FIREBASE_EMULATOR_HOST__']
  );
}

@Service()
export class AuthService {
  private readonly firebase = inject(FirebaseAppService);
  private readonly isBrowserContext = isBrowser();

  private readonly state = signal<AuthState>(
    this.isBrowserContext ? { kind: 'loading' } : UNAUTHENTICATED,
  );

  /** Active authentication state signal. */
  readonly authState: Signal<AuthState> = this.state.asReadonly();

  private readonly _lastError = signal<import('./auth-state').AuthErrorCode | null>(null);
  readonly lastError: Signal<import('./auth-state').AuthErrorCode | null> = this._lastError.asReadonly();

  private authPromise: Promise<Auth> | null = null;
  private permanentlyUnavailable = false;
  private emulatorConnected = false;

  constructor() {
    if (this.isBrowserContext) {
      void this.getAuthModule().catch(() => {
        // Errors are surfaced through lastError
      });
    }
  }

  /** Eagerly initializes auth to accelerate state resolution on route activation. */
  warmUp(): Promise<Auth> {
    return this.getAuthModule();
  }

  /** Initiates Google sign-in popup, verifying the admin claim before authenticating. */
  async signInWithGoogle(): Promise<void> {
    if (!this.isBrowserContext || this.permanentlyUnavailable) {
      throw new AuthError('unavailable');
    }

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new AuthError('unavailable')), SIGN_IN_TIMEOUT_MS),
    );

    try {
      await Promise.race([this.performGoogleSignIn(), timeout]);
    } catch (err) {
      const code = normalizeAuthError(err);
      throw new AuthError(code);
    }
  }

  /** Signs out the current user. */
  async signOut(): Promise<void> {
    if (!this.isBrowserContext || this.permanentlyUnavailable) {
      throw new AuthError('unavailable');
    }

    try {
      const auth = await this.getAuthModule();
      const { signOut: fbSignOut } = await import('firebase/auth');
      await fbSignOut(auth);
    } catch (err) {
      const code = normalizeAuthError(err);
      throw new AuthError(code);
    }
  }

  /** Returns the memoized Auth instance, dynamically importing firebase/auth if needed. */
  private getAuthModule(): Promise<Auth> {
    if (!this.isBrowserContext || this.permanentlyUnavailable) {
      return Promise.reject(new AuthError('unavailable'));
    }
    this.authPromise ??= this.initializeAuth();
    return this.authPromise;
  }

  /** Dynamically loads firebase/auth and registers the auth state listener. */
  private async initializeAuth(): Promise<Auth> {
    try {
      const app = await this.firebase.getApp();
      if (app === null) {
        throw new AuthError('unavailable');
      }

      const { getAuth, onAuthStateChanged, connectAuthEmulator } = await import('firebase/auth');
      const auth = getAuth(app);

      if (isEmulatorSession() && !this.emulatorConnected) {
        connectAuthEmulator(auth, 'http://localhost:9199', { disableWarnings: true });
        this.emulatorConnected = true;
      }

      onAuthStateChanged(auth, (user) => {
        if (user === null) {
          this.state.set(UNAUTHENTICATED);
        } else {
          void this.verifyAndSetUser(user);
        }
      });

      return auth;
    } catch (err) {
      this.permanentlyUnavailable = true;
      this.state.set(UNAUTHENTICATED);
      throw err instanceof AuthError ? err : new AuthError('unavailable');
    }
  }

  /** Performs Google popup sign-in and verifies the admin claim token. */
  private async performGoogleSignIn(): Promise<void> {
    const auth = await this.getAuthModule();
    const { signInWithPopup, GoogleAuthProvider, getIdTokenResult, signOut: fbSignOut } =
      await import('firebase/auth');

    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    const user = credential.user;

    const result = await getIdTokenResult(user, true);
    if (result.claims['admin'] !== true) {
      await fbSignOut(auth);
      this.state.set(UNAUTHENTICATED);
      this._lastError.set('insufficient-permissions');
      throw new AuthError('insufficient-permissions');
    }

    this.state.set({
      kind: 'authenticated',
      uid: user.uid,
      email: user.email,
    });
  }

  /** Verifies the admin custom claim on token refresh, signing out unauthorized users. */
  private async verifyAndSetUser(user: User): Promise<void> {
    try {
      const { getIdTokenResult, signOut: fbSignOut } = await import('firebase/auth');
      const result = await getIdTokenResult(user, true);

      if (result.claims['admin'] !== true) {
        const auth = await this.getAuthModule();
        await fbSignOut(auth);
        this.state.set(UNAUTHENTICATED);
        this._lastError.set('insufficient-permissions');
        return;
      }

      this.state.set({
        kind: 'authenticated',
        uid: user.uid,
        email: user.email,
      });
    } catch {
      this.state.set(UNAUTHENTICATED);
    }
  }
}
