/**
 * Scans source text (CSS/SCSS/HTML) for physical-direction properties or Tailwind
 * utility classes (e.g. ml-*, text-left) that should use logical equivalents (e.g. ms-*, text-start).
 */

/** Physical-direction property match occurrence with character offset. */
export interface PhysicalPropertyMatch {
  /** The exact token matched (e.g. `margin-left`, `ml-4`, `text-right`). */
  readonly token: string;
  /** 0-based character offset of the match within the source text. */
  readonly offset: number;
}

/** Source-declared exemption for properties that intentionally reference physical axes. */
export interface PhysicalPropertyExemption {
  /** The exempted token pattern (regex source). */
  readonly pattern: RegExp;
  /** Human-readable reason this token is intentionally physical. */
  readonly reason: string;
}

// Exemptions for properties targeting physical viewports, overscroll, or transforms

export const PHYSICAL_PROPERTY_EXEMPTIONS: readonly PhysicalPropertyExemption[] = [
  {
    pattern: /\bscroll-margin-left\b/,
    reason: 'Scroll snap alignment targets a physical viewport edge independent of text direction.',
  },
  {
    pattern: /\bscroll-margin-right\b/,
    reason: 'Scroll snap alignment targets a physical viewport edge independent of text direction.',
  },
  {
    pattern: /\bscroll-padding-left\b/,
    reason: 'Scroll snap padding targets a physical viewport edge independent of text direction.',
  },
  {
    pattern: /\bscroll-padding-right\b/,
    reason: 'Scroll snap padding targets a physical viewport edge independent of text direction.',
  },
  {
    pattern: /\boverscroll-behavior-x\b/,
    reason: 'Overscroll behavior operates on the physical x-axis, not the inline axis.',
  },
  {
    pattern: /\btransform\s*:[^;}]*\b(?:translateX|translate3d)/,
    reason:
      'CSS transforms operate in physical coordinate space; direction-awareness is handled by the Direction_Adapter at runtime.',
  },
];

// ---------------------------------------------------------------------------
// Physical_Direction_Property patterns
//
// Two categories:
//   1. CSS declaration properties — matched as property names followed by
//      a colon or whitespace (to avoid matching substrings of unrelated
//      identifiers).
//   2. Tailwind utility classes — matched as class-name tokens (preceded by
//      a word boundary or whitespace/quote).
//
// Every pattern uses word boundaries and/or lookahead to avoid false
// positives on Logical_Property equivalents that share a substring (e.g.
// `text-start` must not match a `text-l...` pattern, `border-s-*` must not
// match a `border-l-*` pattern).
// ---------------------------------------------------------------------------

/**
 * CSS properties that are physical-direction. These are matched as whole
 * property names (word boundary on both sides or followed by `:` / whitespace).
 */
const CSS_PHYSICAL_PROPERTIES: readonly string[] = [
  'margin-left',
  'margin-right',
  'padding-left',
  'padding-right',
  'border-left',
  'border-left-width',
  'border-left-style',
  'border-left-color',
  'border-right',
  'border-right-width',
  'border-right-style',
  'border-right-color',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'left',
  'right',
];

/**
 * CSS `text-align` physical values. We match `text-align` followed by `:` and
 * then `left` or `right` as the value.
 */
const TEXT_ALIGN_PHYSICAL_RE = /\btext-align\s*:\s*(?:left|right)\b/g;

/**
 * Tailwind physical-direction utility class patterns. Each entry is a regex
 * that matches the utility token. Negative-lookbehind/lookahead prevents
 * matching logical equivalents (e.g. `ms-` vs `ml-`, `border-s-` vs `border-l-`).
 */
const TAILWIND_PHYSICAL_PATTERNS: readonly RegExp[] = [
  // Margin: ml-*, mr-* (but NOT ms-*, me-*)
  /(?<![a-zA-Z0-9_-])(?:-?)ml-[a-zA-Z0-9[\]./_]+/g,
  /(?<![a-zA-Z0-9_-])(?:-?)mr-[a-zA-Z0-9[\]./_]+/g,

  // Padding: pl-*, pr-* (but NOT ps-*, pe-*)
  /(?<![a-zA-Z0-9_-])pl-[a-zA-Z0-9[\]./_]+/g,
  /(?<![a-zA-Z0-9_-])pr-[a-zA-Z0-9[\]./_]+/g,

  // Text alignment: text-left, text-right (but NOT text-start, text-end)
  /(?<![a-zA-Z0-9_-])text-left(?![a-zA-Z0-9_-])/g,
  /(?<![a-zA-Z0-9_-])text-right(?![a-zA-Z0-9_-])/g,

  // Positioning: left-*, right-* (but NOT start-*, end-*)
  /(?<![a-zA-Z0-9_-])left-[a-zA-Z0-9[\]./_]+/g,
  /(?<![a-zA-Z0-9_-])right-[a-zA-Z0-9[\]./_]+/g,

  // Border width/color: border-l-*, border-r-* (but NOT border-s-*, border-e-*)
  /(?<![a-zA-Z0-9_-])border-l-[a-zA-Z0-9[\]./_]+/g,
  /(?<![a-zA-Z0-9_-])border-r-[a-zA-Z0-9[\]./_]+/g,
  /(?<![a-zA-Z0-9_-])border-l(?![a-zA-Z0-9_-])/g,
  /(?<![a-zA-Z0-9_-])border-r(?![a-zA-Z0-9_-])/g,

  // Rounded: rounded-l-*, rounded-r-*, rounded-tl-*, rounded-tr-*,
  //          rounded-bl-*, rounded-br-* (but NOT rounded-s-*, rounded-e-*,
  //          rounded-ss-*, rounded-se-*, rounded-es-*, rounded-ee-*)
  /(?<![a-zA-Z0-9_-])rounded-l-[a-zA-Z0-9[\]./_]+/g,
  /(?<![a-zA-Z0-9_-])rounded-r-[a-zA-Z0-9[\]./_]+/g,
  /(?<![a-zA-Z0-9_-])rounded-l(?![a-zA-Z0-9_-])/g,
  /(?<![a-zA-Z0-9_-])rounded-r(?![a-zA-Z0-9_-])/g,
  /(?<![a-zA-Z0-9_-])rounded-tl-[a-zA-Z0-9[\]./_]+/g,
  /(?<![a-zA-Z0-9_-])rounded-tr-[a-zA-Z0-9[\]./_]+/g,
  /(?<![a-zA-Z0-9_-])rounded-bl-[a-zA-Z0-9[\]./_]+/g,
  /(?<![a-zA-Z0-9_-])rounded-br-[a-zA-Z0-9[\]./_]+/g,
  /(?<![a-zA-Z0-9_-])rounded-tl(?![a-zA-Z0-9_-])/g,
  /(?<![a-zA-Z0-9_-])rounded-tr(?![a-zA-Z0-9_-])/g,
  /(?<![a-zA-Z0-9_-])rounded-bl(?![a-zA-Z0-9_-])/g,
  /(?<![a-zA-Z0-9_-])rounded-br(?![a-zA-Z0-9_-])/g,

  // Space: space-x-* (physical x-axis spacing)
  /(?<![a-zA-Z0-9_-])space-x-[a-zA-Z0-9[\]./_]+/g,

  // Float and clear
  /(?<![a-zA-Z0-9_-])float-left(?![a-zA-Z0-9_-])/g,
  /(?<![a-zA-Z0-9_-])float-right(?![a-zA-Z0-9_-])/g,
  /(?<![a-zA-Z0-9_-])clear-left(?![a-zA-Z0-9_-])/g,
  /(?<![a-zA-Z0-9_-])clear-right(?![a-zA-Z0-9_-])/g,
];

/**
 * CSS physical properties matched as whole words followed by a colon (to
 * confirm they're used as CSS property declarations, not as part of a
 * comment or unrelated identifier). The `left` and `right` properties are
 * special-cased to avoid false positives on words like "highlight" or
 * "copyright".
 */
function buildCssPropertyPattern(): RegExp {
  // All properties except bare `left`/`right` which need special handling
  const longProps = CSS_PHYSICAL_PROPERTIES.filter((p) => p !== 'left' && p !== 'right');
  const escaped = longProps.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`));

  // `left` and `right` as CSS positioning properties: must be preceded by
  // a line start, semicolon, opening brace, or whitespace (typical CSS
  // declaration contexts) and followed by a colon.
  const barePositionProps = String.raw`(?:^|[;{\s])\s*(left|right)\s*:`;

  // Combined: either a long property name as a word boundary or a bare
  // position property in declaration context.
  const combined = String.raw`(?:(?:${escaped.join('|')})\s*:)|(?:${barePositionProps})`;
  return new RegExp(combined, 'gm');
}

const CSS_PHYSICAL_PROPERTY_RE = buildCssPropertyPattern();

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

/**
 * Pure total function: scans `sourceText` for every Physical_Direction_Property
 * occurrence. Returns every match with its token and character offset. Returns
 * an empty array for text holding only Logical_Property equivalents.
 *
 * Holds zero I/O operation, zero Angular import, zero throw for any input.
 *
 * arabic-rtl-infrastructure R11.3
 */
export function findPhysicalDirectionProperties(
  sourceText: string,
): readonly PhysicalPropertyMatch[] {
  const matches: PhysicalPropertyMatch[] = [];

  // --- CSS declaration properties ---
  CSS_PHYSICAL_PROPERTY_RE.lastIndex = 0;
  let cssMatch: RegExpExecArray | null;
  while ((cssMatch = CSS_PHYSICAL_PROPERTY_RE.exec(sourceText)) !== null) {
    // The regex may capture the leading context character for bare left/right.
    // Extract the actual property token.
    const fullMatch = cssMatch[0];
    const capturedBare = cssMatch[1]; // 'left' or 'right' from the bare-position group

    let token: string;
    let offset: number;

    if (capturedBare) {
      // Bare `left:` or `right:` — extract just the property name
      token = capturedBare;
      offset = cssMatch.index + fullMatch.indexOf(capturedBare);
    } else {
      // Long property name like `margin-left` — strip trailing whitespace/colon
      token = fullMatch.slice(0, fullMatch.indexOf(':')).trimEnd();
      offset = cssMatch.index;
    }

    if (!isExempt(token, offset, sourceText)) {
      matches.push({ token, offset });
    }
  }

  // --- CSS text-align: left/right ---
  TEXT_ALIGN_PHYSICAL_RE.lastIndex = 0;
  let textAlignMatch: RegExpExecArray | null;
  while ((textAlignMatch = TEXT_ALIGN_PHYSICAL_RE.exec(sourceText)) !== null) {
    const token = textAlignMatch[0];
    const offset = textAlignMatch.index;
    if (!isExempt(token, offset, sourceText)) {
      matches.push({ token, offset });
    }
  }

  // --- Tailwind utility classes ---
  for (const pattern of TAILWIND_PHYSICAL_PATTERNS) {
    pattern.lastIndex = 0;
    let twMatch: RegExpExecArray | null;
    while ((twMatch = pattern.exec(sourceText)) !== null) {
      const token = twMatch[0];
      const offset = twMatch.index;
      if (!isExempt(token, offset, sourceText)) {
        matches.push({ token, offset });
      }
    }
  }

  // Sort by offset for deterministic output order.
  matches.sort((a, b) => a.offset - b.offset);

  return matches;
}

// ---------------------------------------------------------------------------
// Exemption check
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the matched token at the given offset falls within an
 * exempted context (one of the PHYSICAL_PROPERTY_EXEMPTIONS patterns matches
 * the surrounding source text at that position).
 */
function isExempt(token: string, offset: number, sourceText: string): boolean {
  // Check a window of text around the match against each exemption pattern.
  const windowStart = Math.max(0, offset - 40);
  const windowEnd = Math.min(sourceText.length, offset + token.length + 80);
  const window = sourceText.slice(windowStart, windowEnd);

  for (const exemption of PHYSICAL_PROPERTY_EXEMPTIONS) {
    exemption.pattern.lastIndex = 0;
    if (exemption.pattern.test(window)) {
      return true;
    }
  }
  return false;
}
