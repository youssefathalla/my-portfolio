/**
 * Secret-pattern build guard.
 * Scans source files for credential and secret patterns (API keys, private keys, tokens)
 * to prevent accidental commits to version control.
 */

export interface SecretPattern {
  readonly name: string;
  readonly pattern: RegExp;
}

export const SECRET_PATTERNS: readonly SecretPattern[] = [
  { name: 'Resend API Key (Mail_Credential)', pattern: /re_\w{20,}/ },
  { name: 'Webhook_Secret', pattern: /whsec_\w{20,}/ },
  { name: 'reCAPTCHA v3 secret key', pattern: /6L[\w-]{38}/ },
  { name: 'Firebase service-account private key', pattern: /-----BEGIN (?:RSA )?PRIVATE KEY-----/ },
  { name: 'App_Check_Debug_Token', pattern: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ },
];

/** Public environment fields permitted to carry client-side web keys. */
export const CARVE_OUT_EXEMPT_FIELDS: readonly string[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
  'appCheckSiteKey',
];

export interface SecretMatch {
  readonly patternName: string;
  readonly line: number;
}

/**
 * Scans file lines against secret patterns, returning matching pattern names and line numbers.
 * Exempts public appCheckSiteKey in environment files.
 *
 * @param filePath - File path for diagnostics.
 * @param text - File contents to scan.
 * @param isEnvironmentFile - Whether the target is an environment configuration file.
 */
export function findSecretPatternMatches(
  _filePath: string,
  text: string,
  isEnvironmentFile: boolean,
): SecretMatch[] {
  const matches: SecretMatch[] = [];
  const lines = text.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];

    for (const secret of SECRET_PATTERNS) {
      if (secret.pattern.test(line)) {
        // Carve-out exemption: if this is environment.ts AND the pattern
        // is the reCAPTCHA v3 secret key pattern AND the line contains
        // `appCheckSiteKey`, skip it — it's the public site key.
        if (
          isEnvironmentFile &&
          secret.name === 'reCAPTCHA v3 secret key' &&
          line.includes('appCheckSiteKey')
        ) {
          continue;
        }

        matches.push({
          patternName: secret.name,
          line: lineIndex + 1, // 1-indexed line number
        });
      }
    }
  }

  return matches;
}
