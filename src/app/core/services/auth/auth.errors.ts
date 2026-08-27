/**
 * Standard Firebase Authentication error codes mapped to user-friendly messages.
 * Centralized for consistency and to reduce duplication.
 */
export const AUTH_ERROR_MAPPINGS: Record<string, string> = {
  'auth/user-not-found': 'Email not found. Please check your spelling or sign up',
  'auth/wrong-password': 'Incorrect password. Try again or reset it',
  'auth/invalid-credential': 'Invalid email or password. Please try again',
  'auth/email-already-in-use': 'This email is already registered',
  'auth/weak-password': 'Password is too weak. Use at least 8 characters',
  'auth/invalid-email': 'Please enter a valid email address',
  'auth/user-disabled': 'This account has been disabled',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later',
  'auth/popup-closed-by-user': 'Sign-in cancelled',
  'auth/popup-blocked': 'Pop-up blocked. Please allow pop-ups for this site',
  'auth/network-request-failed': 'Network connection error. Check your internet',
  'auth/requires-recent-login': 'Please log in again to perform this action',
} as const;

/** Default message when an unknown authentication error occurs. */
export const DEFAULT_AUTH_ERROR = 'Authentication failed. Please try again';
