/**
 * Strict-mode claim guard.
 * Ensures marketing copy asserting strict TypeScript compilation or zero-`any`
 * is backed by active strict flags in tsconfig.json.
 */

/** The subset of `tsconfig.json` compiler options this guard inspects. */
export interface StrictModeConfig {
  readonly strict?: boolean;
  readonly strictTemplates?: boolean;
  readonly strictInjectionParameters?: boolean;
}

/** Matches English strict TypeScript claims (e.g. "100% Strict TypeScript"). */
const STRICT_TYPESCRIPT_CLAIM_PATTERN = /\bstrict\s+typescript\b/i;

/** Matches English claims that `any` is absent (e.g. "No 'any'", "zero any"). */
const NO_ANY_CLAIM_PATTERN = /\b(?:no|zero|absence of)\b[^a-z0-9]{0,3}any\b/i;

/** Matches Arabic strict-TypeScript claims. */
const ARABIC_STRICT_TYPESCRIPT_CLAIM_PATTERN =
  /(?:typescript|تايب\s?سكريبت)[^\p{L}\p{N}]{0,3}(?:بنمط[^\p{L}\p{N}]{1,3})?(?:ال)?صارمة?/iu;

/** Matches Arabic no-`any` claims. */
const ARABIC_NO_ANY_CLAIM_PATTERN = /(?:بدون|بلا|دون|صفر)[^\p{L}\p{N}]{0,3}any\b/iu;

/** Ordered (config key, tsconfig option name) pairs required to be true. */
const REQUIRED_STRICT_OPTIONS: readonly (readonly [keyof StrictModeConfig, string])[] = [
  ['strict', 'strict'],
  ['strictTemplates', 'strictTemplates'],
  ['strictInjectionParameters', 'strictInjectionParameters'],
];

/** Returns an error message if content asserts strict-mode claims while tsconfig options are disabled. */
export function validateStrictModeClaim(claimText: string, config: StrictModeConfig): string | null {
  const makesStrictClaim =
    STRICT_TYPESCRIPT_CLAIM_PATTERN.test(claimText) ||
    NO_ANY_CLAIM_PATTERN.test(claimText) ||
    ARABIC_STRICT_TYPESCRIPT_CLAIM_PATTERN.test(claimText) ||
    ARABIC_NO_ANY_CLAIM_PATTERN.test(claimText);

  if (!makesStrictClaim) {
    return null;
  }

  const absentOptions = REQUIRED_STRICT_OPTIONS.filter(([key]) => config[key] !== true).map(
    ([, optionName]) => optionName,
  );

  if (absentOptions.length === 0) {
    return null;
  }

  return (
    `Content claims strict TypeScript compilation ("${claimText}") but the ` +
    `build configuration is missing: ${absentOptions.join(', ')}.`
  );
}
