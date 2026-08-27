/**
 * Maps known backend/server error messages to their corresponding i18n translation keys.
 * This ensures consistent error reporting across different features of the application.
 */
export const SERVER_ERROR_MAPPINGS: Record<string, string> = {
  // Auth Errors
  'This email is already in use.': 'errors.auth.emailInUse',
  'The email address is invalid.': 'errors.auth.invalidEmail',
  'Password does not meet project security requirements.': 'errors.auth.weakPassword',

  // General Errors
  'The function must be called while authenticated.': 'errors.functions.unauthenticated',
  'Only admins can create new accounts.': 'errors.functions.permissionDenied',
};

/**
 * Resolves a display message from a server error, either by mapping a known message
 * to an i18n key or returning the original message/fallback.
 *
 * @param serverMessage The raw error message from the server
 * @param fallbackKey Optional translation key to use if no mapping or space-containing message is found
 * @returns An i18n key or a descriptive string message
 */
export function resolveErrorMessage(serverMessage: string, fallbackKey: string): string {
  if (!serverMessage) return fallbackKey;

  // Check for a specific mapping first
  if (SERVER_ERROR_MAPPINGS[serverMessage]) {
    return SERVER_ERROR_MAPPINGS[serverMessage];
  }

  // If message contains spaces, it's likely a descriptive sentence that we can't map but might want to show
  // (though the architect review suggests preferring mappings).
  if (serverMessage.includes(' ')) {
    return serverMessage;
  }

  // Fallback to the provided key (e.g., 'management.errorCreate')
  return fallbackKey;
}
