/**
 * Verifies that all configuration and source paths referenced in firebase.json exist on disk.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Path properties extracted from firebase.json. */
interface FirebaseConfig {
  readonly firestore?: {
    readonly rules?: string;
    readonly indexes?: string;
  };
  readonly functions?: readonly ({
    readonly source?: string;
  })[];
}

/**
 * Validates that all files and directories referenced in firebase.json exist.
 *
 * @param workspaceRoot - Absolute path to workspace root.
 */
export function validateDeploymentConfigPaths(workspaceRoot: string): string[] {
  const firebaseJsonPath = resolve(workspaceRoot, 'firebase.json');

  if (!existsSync(firebaseJsonPath)) {
    return [`firebase.json not found at "${firebaseJsonPath}"`];
  }

  let config: FirebaseConfig;
  try {
    const raw = readFileSync(firebaseJsonPath, 'utf-8');
    config = JSON.parse(raw) as FirebaseConfig;
  } catch (err) {
    return [`firebase.json could not be parsed: ${(err as Error).message}`];
  }

  const missing: string[] = [];

  // Security_Rules file path.
  if (config.firestore?.rules) {
    const rulesPath = resolve(workspaceRoot, config.firestore.rules);
    if (!existsSync(rulesPath)) {
      missing.push(`firestore.rules path "${config.firestore.rules}" does not exist (resolved: "${rulesPath}")`);
    }
  }

  // Index configuration file path.
  if (config.firestore?.indexes) {
    const indexesPath = resolve(workspaceRoot, config.firestore.indexes);
    if (!existsSync(indexesPath)) {
      missing.push(`firestore.indexes path "${config.firestore.indexes}" does not exist (resolved: "${indexesPath}")`);
    }
  }

  // Cloud Functions source directory (first entry).
  if (config.functions && config.functions.length > 0 && config.functions[0].source) {
    const functionsSourcePath = resolve(workspaceRoot, config.functions[0].source);
    if (!existsSync(functionsSourcePath)) {
      missing.push(`functions source "${config.functions[0].source}" does not exist (resolved: "${functionsSourcePath}")`);
    }
  }

  return missing;
}
