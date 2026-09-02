/**
 * Build guard suite runner.
 * Runs content, manifest, configuration, index, and styling guards,
 * collecting all failures before reporting and exiting.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

import { DEFAULT_LOCALE, LOCALES } from '@core/i18n/locale';
import { ROUTE_MANIFEST } from '@core/routing/route-manifest';
import { SEO_CONTENT } from '@core/seo/seo.content';

import {
  findCurrencyOrRateViolations,
  findEasternArabicNumerals,
  findPlaceholderTokens,
} from './content-text-guards';
import {
  findDuplicatePaths,
  findInvalidManifestEntries,
  findMetadataBoundViolations,
} from './route-manifest-guards';
import { validateDeploymentConfigPaths } from './deployment-config-guards';
import { findSecretPatternMatches } from './secret-pattern-guards';
import { validateMaterialCdkAlignment } from './material-version-guards';
import { validateStrictModeClaim } from './strict-mode-guards';
import type { StrictModeConfig } from './strict-mode-guards';
import { checkFirestoreIndexes } from './firestore-index-guards';
import { findPhysicalDirectionProperties } from './logical-property-guards';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(__dirname, '../..');

const failures: string[] = [];
const info: string[] = [];

// Content sources scanned for text rules
interface ContentSource {
  readonly name: string;
  readonly value: unknown;
}

const CONTENT_SOURCES: readonly ContentSource[] = [
  ...ROUTE_MANIFEST.map((entry) => ({ name: `METADATA_${entry.key}`, value: entry.metadata })),
  { name: 'SEO_CONTENT', value: SEO_CONTENT },
];

/** Recursively extracts string values with dotted diagnostic paths. */
interface ScannedString {
  readonly path: string;
  readonly text: string;
}

function collectStrings(value: unknown, path: string, out: ScannedString[]): void {
  if (typeof value === 'string') {
    out.push({ path, text: value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => collectStrings(item, `${path}[${i}]`, out));
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      collectStrings(nested, path === '' ? key : `${path}.${key}`, out);
    }
  }
}

const scannedStrings: ScannedString[] = [];
for (const source of CONTENT_SOURCES) {
  collectStrings(source.value, source.name, scannedStrings);
}

// 1. Content-text guards (currency, placeholders, numerals)
for (const { path, text } of scannedStrings) {
  for (const match of findCurrencyOrRateViolations(text)) {
    failures.push(
      `[currency-or-rate] ${path}: found "${match.match}" at index ${match.index} — ` +
        `digit sequences must not sit adjacent to a currency symbol, ISO 4217 code, or rate token`,
    );
  }
  for (const match of findPlaceholderTokens(text)) {
    failures.push(
      `[placeholder-token] ${path}: found literal "${match.match}" at index ${match.index}`,
    );
  }
  for (const match of findEasternArabicNumerals(text)) {
    failures.push(
      `[eastern-arabic-numeral] ${path}: found "${match.match}" at index ${match.index} — ` +
        `Arabic copy must use Western Arabic numerals`,
    );
  }
}

// 2. Material and CDK version alignment

interface PackageJsonVersion {
  readonly name?: string;
  readonly version?: string;
}

function readInstalledPackageVersion(
  packageName: string,
): { name: string; version: string } | null {
  const packageJsonPath = resolve(workspaceRoot, 'node_modules', packageName, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return null;
  }
  try {
    const raw = readFileSync(packageJsonPath, 'utf-8');
    const parsed = JSON.parse(raw) as PackageJsonVersion;
    if (!parsed.version) {
      return null;
    }
    return { name: packageName, version: parsed.version };
  } catch {
    return null;
  }
}

const materialVersion = readInstalledPackageVersion('@angular/material');
const cdkVersion = readInstalledPackageVersion('@angular/cdk');

if (!materialVersion || !cdkVersion) {
  failures.push(
    '[material-cdk-alignment] could not read installed @angular/material and/or @angular/cdk package.json',
  );
} else {
  const alignmentFailure = validateMaterialCdkAlignment(materialVersion, cdkVersion);
  if (alignmentFailure) {
    failures.push(`[material-cdk-alignment] ${alignmentFailure}`);
  }
}

// ---------------------------------------------------------------------------
// c. Route_Manifest guards (R2.8, R2.9, R6.1, R6.2, R6.3, R6.4, R6.6).
// ---------------------------------------------------------------------------

for (const duplicatePath of findDuplicatePaths(ROUTE_MANIFEST)) {
  failures.push(
    `[route-manifest-duplicate-path] path "${duplicatePath}" is declared by more than one entry`,
  );
}

for (const err of findInvalidManifestEntries(ROUTE_MANIFEST, LOCALES)) {
  failures.push(`[route-manifest-invalid-entry] ${err.key}.${err.field}: ${err.reason}`);
}

for (const err of findMetadataBoundViolations(ROUTE_MANIFEST, LOCALES, DEFAULT_LOCALE)) {
  failures.push(`[route-manifest-metadata-bound] ${err.key}.${err.field}: ${err.reason}`);
}

// 4. Deployment config path existence
for (const missing of validateDeploymentConfigPaths(workspaceRoot)) {
  failures.push(`[deployment-config-path] ${missing}`);
}

// 5. Strict-mode compiler claims
let strictModeConfig: StrictModeConfig = {};
try {
  const tsconfigPath = resolve(workspaceRoot, 'tsconfig.json');
  const { config: parsedTsconfig, error } = ts.readConfigFile(tsconfigPath, ts.sys.readFile) as {
    config?: {
      compilerOptions?: { strict?: boolean };
      angularCompilerOptions?: { strictTemplates?: boolean; strictInjectionParameters?: boolean };
    };
    error?: ts.Diagnostic;
  };
  if (error) {
    const message = ts.flattenDiagnosticMessageText(error.messageText, '\n');
    failures.push(`[strict-mode-config] could not read/parse tsconfig.json: ${message}`);
  } else if (parsedTsconfig) {
    strictModeConfig = {
      strict: parsedTsconfig.compilerOptions?.strict,
      strictTemplates: parsedTsconfig.angularCompilerOptions?.strictTemplates,
      strictInjectionParameters: parsedTsconfig.angularCompilerOptions?.strictInjectionParameters,
    };
  }
} catch (err) {
  failures.push(
    `[strict-mode-config] could not read/parse tsconfig.json: ${(err as Error).message}`,
  );
}

for (const { path, text } of scannedStrings) {
  const strictModeFailure = validateStrictModeClaim(text, strictModeConfig);
  if (strictModeFailure) {
    failures.push(`[strict-mode-claim] ${path}: ${strictModeFailure}`);
  }
}

// 6. Secret pattern detection
const SECRET_SCAN_ROOTS: readonly string[] = ['src', 'functions/src', 'shared/submission-schema'];
const SECRET_SCAN_FILES: readonly string[] = [
  'firebase.json',
  '.firebaserc',
  'firestore.rules',
  'firestore.indexes.json',
];
const SECRET_SCAN_EXTENSIONS: ReadonlySet<string> = new Set(['.ts', '.html', '.json', '.rules']);
const SECRET_SCAN_EXCLUDED_DIRS: ReadonlySet<string> = new Set([
  'node_modules',
  'dist',
  'lib',
  '.angular',
]);

// Public environment configs exempted from reCAPTCHA pattern match
const ENVIRONMENT_FILE_PATHS: ReadonlySet<string> = new Set([
  resolve(workspaceRoot, 'src/environments/environment.ts'),
  resolve(workspaceRoot, 'src/environments/environment.prod.ts'),
]);

function collectFiles(
  root: string,
  extensions: ReadonlySet<string>,
  excludedDirs: ReadonlySet<string>,
): string[] {
  const results: string[] = [];
  if (!existsSync(root)) {
    return results;
  }

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      if (excludedDirs.has(entry)) {
        continue;
      }
      const fullPath = join(dir, entry);
      const stats = statSync(fullPath);
      if (stats.isDirectory()) {
        walk(fullPath);
      } else if (extensions.has(extname(entry))) {
        results.push(fullPath);
      }
    }
  };

  walk(root);
  return results;
}

const secretScanFiles: string[] = [
  ...SECRET_SCAN_ROOTS.flatMap((root) =>
    collectFiles(resolve(workspaceRoot, root), SECRET_SCAN_EXTENSIONS, SECRET_SCAN_EXCLUDED_DIRS),
  ),
  ...SECRET_SCAN_FILES.map((file) => resolve(workspaceRoot, file)).filter((file) =>
    existsSync(file),
  ),
];

for (const filePath of secretScanFiles) {
  const text = readFileSync(filePath, 'utf-8');
  const isEnvironmentFile = ENVIRONMENT_FILE_PATHS.has(filePath);
  for (const match of findSecretPatternMatches(filePath, text, isEnvironmentFile)) {
    failures.push(`[secret-pattern] ${filePath}:${match.line}: matched ${match.patternName}`);
  }
}

// 7. Firestore composite index drift
const firestoreIndexResult = checkFirestoreIndexes(workspaceRoot);
for (const failure of firestoreIndexResult.failures) {
  failures.push(`[firestore-index-drift] ${failure}`);
}
for (const note of firestoreIndexResult.info) {
  info.push(`[firestore-index-drift] ${note}`);
}

// 8. Logical property enforcement (admin pages and templates)
const LOGICAL_PROP_SCAN_FILES: readonly string[] = [
  'src/app/admin/pages/login/login-page.scss',
  'src/app/admin/pages/login/login-page.html',
  'src/app/admin/pages/shell/admin-shell.scss',
  'src/app/admin/pages/shell/admin-shell.html',
  'src/app/admin/pages/overview/overview-page.scss',
  'src/app/admin/pages/overview/overview-page.html',
  'src/app/admin/pages/submissions-list/submissions-list-page.scss',
  'src/app/admin/pages/submissions-list/submissions-list-page.html',
  'src/app/admin/pages/submission-detail/submission-detail-page.scss',
  'src/app/admin/pages/submission-detail/submission-detail-page.html',
];

for (const relativePath of LOGICAL_PROP_SCAN_FILES) {
  const filePath = resolve(workspaceRoot, relativePath);
  if (!existsSync(filePath)) {
    failures.push(`[logical-property] scan target "${relativePath}" does not exist`);
    continue;
  }
  const text = readFileSync(filePath, 'utf-8');
  for (const match of findPhysicalDirectionProperties(text)) {
    failures.push(
      `[logical-property] ${relativePath}: found physical-direction token "${match.token}" at offset ${match.offset}`,
    );
  }
}

// 9. Report results and exit status

if (info.length > 0) {
  console.info(`Build_Guard_Suite: ${info.length} informational note(s):`);
  for (const note of info) {
    console.info(`  ${note}`);
  }
}

if (failures.length > 0) {
  console.error(`Build_Guard_Suite: ${failures.length} failure(s) found:\n`);
  for (const failure of failures) {
    console.error(`  ${failure}`);
  }
  process.exit(1);
} else {
  console.log('Build_Guard_Suite: all guards passed.');
  process.exit(0);
}
