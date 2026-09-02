/**
 * Authentication state types and error normalization (admin-dashboard R1.2, R1.4, R4.4).
 *
 * Pure module — zero Angular import, zero Firebase import.
 */

/** The three discriminated states of the Auth_State signal (R1.2). */
export type AuthState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'authenticated'; readonly uid: string; readonly email: string | null }
  | { readonly kind: 'unauthenticated' };

/** Every state the Auth_Guard can act on — `AuthState` minus `loading` (R2.4). */
export type ResolvedAuthState = Exclude<AuthState, { kind: 'loading' }>;

/** Convenience constant for the unauthenticated state. */
export const UNAUTHENTICATED: ResolvedAuthState = { kind: 'unauthenticated' } as const;

/**
 * The structured codes `signIn` rejects with (R1.4, R1.10). Every raw Firebase
 * Authentication error normalizes into exactly one of these six values, and no
 * raw Firebase message text is ever carried across this boundary.
 */
export type AuthErrorCode =
  | 'invalid-credential'
  | 'user-disabled'
  | 'too-many-requests'
  | 'insufficient-permissions'
  | 'unavailable'
  | 'unknown';

/** The rejection value of `signIn` / `signOut` — a code, never a Firebase error. */
export class AuthError extends Error {
  constructor(readonly code: AuthErrorCode) {
    super(code); // the message is the code; zero raw Firebase text (R1.4)
  }
}

// ── Error normalization (R1.4) ──────────────────────────────────────────────

const RAW_CODE_TO_AUTH_ERROR: Readonly<Record<string, AuthErrorCode>> = {
  'invalid-credential': 'invalid-credential',
  'invalid-email': 'invalid-credential',
  'wrong-password': 'invalid-credential',
  'user-not-found': 'invalid-credential',
  'missing-password': 'invalid-credential',
  'user-disabled': 'user-disabled',
  'too-many-requests': 'too-many-requests',
  'network-request-failed': 'unavailable',
  'internal-error': 'unavailable',
  'popup-closed-by-user': 'unknown',
  'cancelled-popup-request': 'unknown',
  'popup-blocked': 'unavailable',
};

/**
 * Extracts the auth error code from a Firebase error, stripping the `auth/` prefix
 * if present. Returns `null` for non-Firebase-shaped errors.
 */
function extractAuthErrorCode(err: unknown): string | null {
  if (err == null || typeof err !== 'object') return null;
  const code = (err as Record<string, unknown>)['code'];
  if (typeof code !== 'string') return null;
  return code.startsWith('auth/') ? code.slice(5) : code;
}

/** Total: every input yields exactly one code, and zero raw message text escapes (R1.4). */
export function normalizeAuthError(err: unknown): AuthErrorCode {
  if (err instanceof AuthError) return err.code;
  const raw = extractAuthErrorCode(err);
  return raw === null ? 'unknown' : (RAW_CODE_TO_AUTH_ERROR[raw] ?? 'unknown');
}

// ── Login error messages (R4.4) ─────────────────────────────────────────────

/** Maps an `AuthErrorCode` to the user-facing message for the Login_Page (R4.4). */
export function toLoginErrorMessage(code: AuthErrorCode): string {
  switch (code) {
    case 'invalid-credential':
      return 'Sign-in failed';
    case 'user-disabled':
      return 'Account disabled';
    case 'too-many-requests':
      return 'Too many attempts \u2014 try again later';
    case 'insufficient-permissions':
      return 'You do not have admin access';
    case 'unavailable':
      return 'Login failed \u2014 please try again';
    case 'unknown':
      return 'Sign-in was cancelled';
  }
}
