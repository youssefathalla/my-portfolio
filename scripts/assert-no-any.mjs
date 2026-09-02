#!/usr/bin/env node
/**
 * Asserts absence of explicit `any` types, type-suppression comments (@ts-ignore, @ts-expect-error),
 * and Angular `$any(...)` template casts across all application and script files.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, 'src');
const FUNCTIONS_SRC_DIR = join(ROOT, 'functions', 'src');
const SUBMISSION_SCHEMA_DIR = join(ROOT, 'shared', 'submission-schema');
const SCRIPTS_DIR = join(ROOT, 'scripts');

/** @typedef {{ readonly file: string; readonly line: number; readonly reason: string }} Finding */

/** @type {Finding[]} */
const findings = [];

// File discovery

/** Recursively collects every file under `dir` whose extension is in `extensions`. */
function collectFiles(dir, extensions) {
  /** @type {string[]} */
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      out.push(...collectFiles(full, extensions));
    } else if (extensions.includes(extname(entry))) {
      out.push(full);
    }
  }
  return out;
}

/** Recursively collects files, tolerating a missing root (resolves to zero files). */
function collectFilesIfExists(dir, extensions) {
  try {
    return collectFiles(dir, extensions);
  } catch {
    return [];
  }
}

// Blank string and template literals before comments to avoid false delimiters.
// Line breaks and character offsets are preserved for accurate error line numbers.

/** Replaces every non-newline character of `segment` with a space. */
function blank(segment) {
  return segment.replace(/[^\n]/g, ' ');
}

/** Blanks every single- and double-quoted string literal (escape-aware, single-line). */
function stripQuotedStrings(src) {
  return src.replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, blank);
}

/** Tracks nested brace depth inside an interpolation expression. */
function updateBraceDepth(ch, depth) {
  if (ch === '{') return depth + 1;
  if (ch === '}') return depth === 0 ? -1 : depth - 1;
  return depth;
}

/** Processes a character outside template interpolation, preserving newlines and recognizing `${`. */
function processOutsideInterpolation(literal, i) {
  const ch = literal[i];
  const next = literal[i + 1];

  if (ch === '\\') {
    const text = (ch === '\n' ? '\n' : ' ') + (next === '\n' ? '\n' : ' ');
    return { text, nextI: i + 2, depth: -1 };
  }
  if (ch === '$' && next === '{') {
    return { text: '${', nextI: i + 2, depth: 0 };
  }
  return { text: ch === '\n' ? '\n' : ' ', nextI: i + 1, depth: -1 };
}

/** Blanks a single template literal, preserving newlines and expressions inside `${ ... }`. */
function blankTemplateLiteral(literal) {
  let out = '';
  let i = 0;
  let exprDepth = -1;

  while (i < literal.length) {
    if (exprDepth === -1) {
      const res = processOutsideInterpolation(literal, i);
      out += res.text;
      i = res.nextI;
      exprDepth = res.depth;
    } else {
      const ch = literal[i];
      out += ch;
      exprDepth = updateBraceDepth(ch, exprDepth);
      i++;
    }
  }
  return out;
}

// Blanks template literal text while preserving expressions inside ${ ... } interpolations.
function stripTemplateLiterals(src) {
  return src.replace(/`(?:[^`\\]|\\.)*`/g, blankTemplateLiteral);
}

/** Blanks every `/* ... *\/` block comment. */
function stripBlockComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, blank);
}

/** Blanks every `// ...` line comment (does not cross a newline). */
function stripLineComments(src) {
  return src.replace(/\/\/[^\n]*/g, blank);
}

// Blanks regex literal text so patterns like /\bany\b/ are not flagged as TS types.
function stripRegexLiterals(src) {
  return src.replace(
    /(^|[=([:,!&|?{};]\s*|\breturn\s+)\/(?![/*])[^\n/\\]*(?:\\.[^\n/\\]*)*\/[a-z]*/g,
    (full, lead) => lead + blank(full.slice(lead.length)),
  );
}

// Blanks comments, strings, and regexes to isolate real TypeScript syntax.
function stripCommentsAndStringsForTypeScan(src) {
  return stripLineComments(
    stripBlockComments(stripRegexLiterals(stripTemplateLiterals(stripQuotedStrings(src)))),
  );
}

/** 1-based line number of `index` (a 0-based character offset) within `text`. */
function lineNumberAt(text, index) {
  let line = 1;
  const bound = Math.min(index, text.length);
  for (let i = 0; i < bound; i++) {
    if (text.codePointAt(i) === 10 /* '\n' */) {
      line++;
    }
  }
  return line;
}

// Scans original unstripped text for type-suppression comments (@ts-ignore, @ts-expect-error, @ts-nocheck).
const SUPPRESSION_COMMENT_PATTERN = /@ts-ignore|@ts-expect-error|@ts-nocheck/g;

function findSuppressionComments(originalText) {
  /** @type {{ readonly match: string; readonly line: number }[]} */
  const out = [];
  for (const match of originalText.matchAll(SUPPRESSION_COMMENT_PATTERN)) {
    out.push({ match: match[0], line: lineNumberAt(originalText, match.index ?? 0) });
  }
  return out;
}

// Scans stripped text for standalone `any` type tokens.
const ANY_WORD_PATTERN = /\bany\b/g;

function findAnyOccurrences(originalText) {
  const stripped = stripCommentsAndStringsForTypeScan(originalText);
  /** @type {{ readonly line: number }[]} */
  const out = [];
  for (const match of stripped.matchAll(ANY_WORD_PATTERN)) {
    out.push({ line: lineNumberAt(originalText, match.index ?? 0) });
  }
  return out;
}

// Scans Angular HTML templates for $any(...) casts.
const TEMPLATE_ANY_CAST_PATTERN = /\$any\(/g;

function findTemplateAnyCasts(originalText) {
  /** @type {{ readonly line: number }[]} */
  const out = [];
  for (const match of originalText.matchAll(TEMPLATE_ANY_CAST_PATTERN)) {
    out.push({ line: lineNumberAt(originalText, match.index ?? 0) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

function relativeToRoot(path) {
  return path.startsWith(ROOT)
    ? path.slice(ROOT.length + 1).replaceAll('\\', '/')
    : path.replaceAll('\\', '/');
}

const srcTsFiles = collectFilesIfExists(SRC_DIR, ['.ts']);
const srcHtmlFiles = collectFilesIfExists(SRC_DIR, ['.html']);
const functionsTsFiles = collectFilesIfExists(FUNCTIONS_SRC_DIR, ['.ts']);
const submissionSchemaTsFiles = collectFilesIfExists(SUBMISSION_SCHEMA_DIR, ['.ts']);
const scriptsTsFiles = collectFilesIfExists(SCRIPTS_DIR, ['.ts']);

const allTsFiles = [
  ...srcTsFiles,
  ...functionsTsFiles,
  ...submissionSchemaTsFiles,
  ...scriptsTsFiles,
];

for (const filePath of allTsFiles) {
  const text = readFileSync(filePath, 'utf8');
  const relPath = relativeToRoot(filePath);

  for (const { line } of findAnyOccurrences(text)) {
    findings.push({ file: relPath, line, reason: 'explicit `any` type usage' });
  }
  for (const { match, line } of findSuppressionComments(text)) {
    findings.push({ file: relPath, line, reason: `type-checking suppression comment (${match})` });
  }
}

for (const filePath of srcHtmlFiles) {
  const text = readFileSync(filePath, 'utf8');
  const relPath = relativeToRoot(filePath);

  for (const { line } of findTemplateAnyCasts(text)) {
    findings.push({ file: relPath, line, reason: 'Angular `$any(...)` template cast' });
  }
}

// Stable, deterministic ordering: by file path, then by line number.
findings.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file)));

if (findings.length > 0) {
  console.error(`assert-no-any failed with ${findings.length} occurrence(s):\n`);
  for (const finding of findings) {
    console.error(`  ${finding.file}:${finding.line} — ${finding.reason}`);
  }
  process.exit(1);
} else {
  console.log(
    `assert-no-any passed: zero \`any\` occurrences and zero type-checking suppression comments ` +
      `found across ${allTsFiles.length} .ts file(s) ` +
      `(${srcTsFiles.length} under src/, ${functionsTsFiles.length} under functions/src/, ` +
      `${submissionSchemaTsFiles.length} under shared/submission-schema/, ${scriptsTsFiles.length} under scripts/) ` +
      `and ${srcHtmlFiles.length} .html file(s) under src/.`,
  );
}
