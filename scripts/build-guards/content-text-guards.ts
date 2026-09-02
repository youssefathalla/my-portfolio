/**
 * Content-text validation guards.
 * Detects currency/rate placement violations, unresolved placeholder tokens,
 * and Eastern Arabic numerals in public content copy.
 */

/** A single flagged occurrence within a scanned string value. */
export interface TextMatch {
  /** The exact matched substring. */
  readonly match: string;
  /** 0-based character offset of `match` within the scanned value. */
  readonly index: number;
}

/** A half-open character range `[start, end)` within a scanned value. */
interface CharRange {
  readonly start: number;
  readonly end: number;
}

/**
 * Number of characters strictly between two ranges. Zero when the ranges
 * touch or overlap.
 */
function gapBetweenRanges(a: CharRange, b: CharRange): number {
  if (a.end <= b.start) {
    return b.start - a.end;
  }
  if (b.end <= a.start) {
    return a.start - b.end;
  }
  return 0;
}

/**
 * Every (possibly overlapping) occurrence of `needle` within `haystack`,
 * found via plain, case-sensitive substring search. Returns an empty array
 * for an empty `needle` (an empty needle would otherwise match at every
 * index and never terminate usefully).
 */
function findAllOccurrences(haystack: string, needle: string): readonly CharRange[] {
  if (needle.length === 0) {
    return [];
  }
  const ranges: CharRange[] = [];
  let fromIndex = 0;
  let foundAt = haystack.indexOf(needle, fromIndex);
  while (foundAt !== -1) {
    ranges.push({ start: foundAt, end: foundAt + needle.length });
    fromIndex = foundAt + 1;
    foundAt = haystack.indexOf(needle, fromIndex);
  }
  return ranges;
}

/**
 * Case-insensitive variant of {@link findAllOccurrences}. Safe for the
 * ASCII-only rate tokens this module searches for, since lower-casing ASCII
 * text never changes its length or character offsets.
 */
function findAllOccurrencesCaseInsensitive(haystack: string, needle: string): readonly CharRange[] {
  return findAllOccurrences(haystack.toLowerCase(), needle.toLowerCase());
}

/** R12.4, R12.5. Currency symbols a digit sequence must not sit within 3 characters of. */
const CURRENCY_SYMBOLS: readonly string[] = ['$', '€', '£', '¥', '₹', '﷼', 'ج.م'];

/**
 * R12.4, R12.5. Active ISO 4217 currency codes. Deliberately a real,
 * maintained list rather than "any 3 uppercase letters" — a three-letter
 * uppercase token that merely *looks* like a currency code (e.g. `USB`)
 * must not be flagged (see design.md's Property 6 discussion of this exact
 * red herring).
 */
const ISO_4217_CODES: ReadonlySet<string> = new Set([
  'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN',
  'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BOV',
  'BRL', 'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHE', 'CHF',
  'CHW', 'CLF', 'CLP', 'CNY', 'COP', 'COU', 'CRC', 'CUC', 'CUP', 'CVE',
  'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 'ERN', 'ETB', 'EUR', 'FJD',
  'FKP', 'GBP', 'GEL', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD',
  'HNL', 'HTG', 'HUF', 'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK', 'JMD',
  'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD', 'KYD',
  'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA',
  'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN', 'MXV',
  'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB',
  'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB',
  'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE', 'SLL',
  'SOS', 'SRD', 'SSP', 'STN', 'SVC', 'SYP', 'SZL', 'THB', 'TJS', 'TMT',
  'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'USN',
  'UYI', 'UYU', 'UYW', 'UZS', 'VED', 'VES', 'VND', 'VUV', 'WST', 'XAF',
  'XAG', 'XAU', 'XBA', 'XBB', 'XBC', 'XBD', 'XCD', 'XDR', 'XOF', 'XPD',
  'XPF', 'XPT', 'XSU', 'XTS', 'XUA', 'XXX', 'YER', 'ZAR', 'ZMW', 'ZWL',
]);

/** R12.4, R12.5. Rate tokens a digit sequence must not sit immediately next to. */
const RATE_TOKENS: readonly string[] = ['per hour', '/hour', '/hr', 'hourly rate'];

/** Matches a run of one or more decimal digits. */
const DIGIT_SEQUENCE_PATTERN = /\d+/g;

/**
 * Matches a standalone run of exactly 3 uppercase Latin letters — "standalone"
 * meaning not immediately preceded or followed by another letter (of either
 * case), so a longer word like `USDT` or `AUSD` never matches, but a digit
 * sequence glued directly onto the code (e.g. `100USD`) still allows the
 * code itself to be found and checked for digit adjacency.
 */
const ISO_CODE_SHAPED_TOKEN_PATTERN = /(?<![A-Za-z])[A-Z]{3}(?![A-Za-z])/g;

/** "Within 3 characters", per R12.5's currency-symbol/ISO-code adjacency rule. */
const CURRENCY_ADJACENCY_MAX_GAP = 3;

/** "Immediately preceding or following", per R12.5's rate-token adjacency rule. */
const RATE_TOKEN_ADJACENCY_MAX_GAP = 1;

/**
 * R12.4, R12.5. A currency amount = a digit sequence within 3 chars of a
 * symbol in {$,€,£,¥,₹,﷼,ج.م} or of an ISO-4217 code, or adjacent to a rate
 * token {per hour, /hour, /hr, hourly rate}.
 *
 * Never stops at the first violation: every digit sequence in `value` is
 * checked, and one `TextMatch` (the offending digit sequence itself) is
 * returned per violating occurrence.
 */
export function findCurrencyOrRateViolations(value: string): readonly TextMatch[] {
  const digitRanges: CharRange[] = [];
  for (const found of value.matchAll(DIGIT_SEQUENCE_PATTERN)) {
    const start = found.index ?? 0;
    digitRanges.push({ start, end: start + found[0].length });
  }
  if (digitRanges.length === 0) {
    return [];
  }

  const currencySymbolRanges: CharRange[] = CURRENCY_SYMBOLS.flatMap((symbol) =>
    findAllOccurrences(value, symbol),
  );

  const isoCodeRanges: CharRange[] = [];
  for (const found of value.matchAll(ISO_CODE_SHAPED_TOKEN_PATTERN)) {
    if (ISO_4217_CODES.has(found[0])) {
      const start = found.index ?? 0;
      isoCodeRanges.push({ start, end: start + found[0].length });
    }
  }

  const rateTokenRanges: CharRange[] = RATE_TOKENS.flatMap((token) =>
    findAllOccurrencesCaseInsensitive(value, token),
  );

  const matches: TextMatch[] = [];
  for (const digit of digitRanges) {
    const nearCurrencySymbolOrCode =
      currencySymbolRanges.some((range) => gapBetweenRanges(digit, range) <= CURRENCY_ADJACENCY_MAX_GAP) ||
      isoCodeRanges.some((range) => gapBetweenRanges(digit, range) <= CURRENCY_ADJACENCY_MAX_GAP);
    const nearRateToken = rateTokenRanges.some(
      (range) => gapBetweenRanges(digit, range) <= RATE_TOKEN_ADJACENCY_MAX_GAP,
    );

    if (nearCurrencySymbolOrCode || nearRateToken) {
      matches.push({ match: value.slice(digit.start, digit.end), index: digit.start });
    }
  }
  return matches;
}

/** R7.4. Arabic-Indic (٠-٩) and Extended Arabic-Indic (۰-۹) digit code points. */
const EASTERN_ARABIC_DIGIT_PATTERN = /[\u0660-\u0669\u06F0-\u06F9]/gu;

/**
 * R7.4. Every Eastern Arabic numeral occurrence in `value`, reported as a
 * TextMatch on the same contract as the other scanners in this module.
 */
export function findEasternArabicNumerals(value: string): readonly TextMatch[] {
  const matches: TextMatch[] = [];
  for (const found of value.matchAll(EASTERN_ARABIC_DIGIT_PATTERN)) {
    const start = found.index ?? 0;
    matches.push({ match: found[0], index: start });
  }
  return matches;
}

/** R13.9, R13.11. The exact, case-sensitive placeholder token. */
const PLACEHOLDER_TOKEN = 'PLACEHOLDER';

/**
 * R13.9, R13.11. Case-sensitive scan for the uppercase `PLACEHOLDER` token.
 * A string containing the token in any other letter case (e.g.
 * `Placeholder`, `placeholder`) reports zero matches for that occurrence.
 */
export function findPlaceholderTokens(value: string): readonly TextMatch[] {
  return findAllOccurrences(value, PLACEHOLDER_TOKEN).map((range) => ({
    match: value.slice(range.start, range.end),
    index: range.start,
  }));
}
