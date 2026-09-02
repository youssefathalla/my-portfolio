/**
 * Spam_Heuristic — pure, total classification of a Submission_Payload.
 *
 * Zero Angular imports, zero I/O, zero dependency on the current time.
 * The only inputs are the payload argument and the version-controlled BLOCKLIST
 * declared in this module (firebase-backend R11.1, R11.11).
 */

// ---------- Blocklist (R11.11) ----------

/**
 * 1 to 200 lowercase terms, 2 to 64 characters each. Version-controlled;
 * holds zero Environment_Constants reference and zero Secret_Store
 * reference (R11.11).
 */
export const BLOCKLIST: readonly string[] = [
  'viagra',
  'cialis',
  'crypto',
  'casino',
  'lottery',
  'winner',
  'click here',
  'free money',
  'act now',
  'limited time',
  'buy now',
  'earn money',
  'no obligation',
  'risk free',
  'congratulations',
  'you have been selected',
  'urgent reply',
  'double your income',
  'work from home',
  'as seen on',
  'nigerian prince',
  'wire transfer',
  'credit card required',
  'online pharmacy',
  'weight loss',
  'enlargement',
  'binary options',
  'forex trading',
  'guaranteed income',
  'million dollars',
] as const;

// ---------- URL patterns (R11.2(a)) ----------

/**
 * Every alternative a URL substring may start with (R11.2(a)). Anchored to
 * the start of the remainder being scanned so the caller controls where
 * matching is attempted, rather than letting the regex engine choose.
 *
 * Order:
 * 1. https:// (longest protocol prefix first)
 * 2. http://
 * 3. www.
 * 4. Bare domain: one or more alphanumeric/hyphen chars + period + 2+ alpha chars
 */
const URL_PATTERNS: readonly RegExp[] = [
  /^https:\/\//i,
  /^http:\/\//i,
  /^www\./i,
  /^[a-z0-9-]+\.[a-z]{2,}/i,
];

// ---------- classifySpam (R11.1, R11.2) ----------

/**
 * Pure, total function classifying a Submission_Payload as `'new'` or `'spam'`.
 *
 * Returns `'spam'` when any of these conditions holds:
 * - (a) URL-substring count across all string values is 4 or more (R11.2(a)).
 * - (b) Any string value contains a BLOCKLIST term as a case-insensitive substring (R11.2(b)).
 * - (c) A `message` entry exists, is a non-empty string, and its trimmed length is
 *       fewer than 10 characters (R11.2(c)).
 *
 * Returns `'new'` otherwise.
 *
 * Non-string values (number, boolean) are skipped — zero URL substrings and zero
 * blocklist terms are counted for them (R11.2 final sentence).
 *
 * The function accepts `Record<string, string | number | boolean>` to match the
 * SubmissionPayload type from the shared schema, but gracefully handles any input
 * (never throws).
 */
export function classifySpam(payload: Record<string, string | number | boolean>): 'new' | 'spam' {
  // Guard: non-object or null input — pure and total, never throws
  if (payload === null || payload === undefined || typeof payload !== 'object') {
    return 'new';
  }

  const strings: string[] = [];
  for (const value of Object.values(payload)) {
    if (typeof value === 'string') {
      strings.push(value);
    }
  }

  // Condition (a): URL-substring count >= 4
  let urlCount = 0;
  for (const str of strings) {
    urlCount += countUrlSubstrings(str);
    if (urlCount >= 4) return 'spam';
  }

  // Condition (b): blocklist substring match (case-insensitive)
  const lowered = strings.map((s) => s.toLowerCase());
  for (const term of BLOCKLIST) {
    for (const value of lowered) {
      if (value.includes(term)) {
        return 'spam';
      }
    }
  }

  // Condition (c): short trimmed message
  const message = payload['message'];
  if (typeof message === 'string') {
    const trimmed = message.trim();
    if (trimmed.length > 0 && trimmed.length < 10) {
      return 'spam';
    }
  }

  return 'new';
}

// ---------- URL-substring counter ----------

/**
 * Scans left to right. At each position, evaluates every pattern in
 * URL_PATTERNS anchored there and keeps the longest match — satisfying
 * "the longest such occurrence is counted as exactly one URL substring."
 * The scan cursor then advances past that longest match (or by one
 * character when nothing matches), so a shorter alternative match starting
 * inside an already-counted occurrence is never counted a second time
 * ("overlapping occurrences are counted zero further times").
 */
function countUrlSubstrings(value: string): number {
  let count = 0;
  let position = 0;
  while (position < value.length) {
    const remainder = value.slice(position);
    let longestMatch = 0;
    for (const pattern of URL_PATTERNS) {
      const match = pattern.exec(remainder);
      if (match !== null && match[0].length > longestMatch) {
        longestMatch = match[0].length;
      }
    }
    if (longestMatch === 0) {
      position += 1;
    } else {
      count += 1;
      position += longestMatch;
    }
  }
  return count;
}
