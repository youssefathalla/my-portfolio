import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

// Adjusted paths to be relative to the root where the command is likely run
const i18nDir = resolve('public/i18n');

console.log(`Scanning for translation files in: ${i18nDir}`);

let files = [];
try {
  files = readdirSync(i18nDir).filter((f) => f.endsWith('.json'));
} catch (e) {
  console.error('Failed to read i18n directory', e);
  process.exit(1);
}

if (files.length === 0) {
  console.log('No JSON files found.');
  process.exit(0);
}

console.log(`Found languages: ${files.join(', ')}`);

const translations = {};

// 1. Read all files
files.forEach((file) => {
  try {
    const content = readFileSync(join(i18nDir, file), 'utf8');
    translations[file] = JSON.parse(content);
  } catch (e) {
    console.error(`Failed to parse ${file}`, e);
    // Don't crash, just skip? Or crash to be safe? Safer to crash to avoid overwriting with bad data.
    process.exit(1);
  }
});

// 2. Helper Functions
function sortObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortObject);
  return Object.keys(obj)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = sortObject(obj[key]);
      return sorted;
    }, {});
}

function markLeavesAsMissing(obj, missingVal) {
  if (typeof obj !== 'object' || obj === null) return missingVal;
  if (Array.isArray(obj)) return obj;
  const newObj = {};
  for (const key of Object.keys(obj)) {
    newObj[key] = markLeavesAsMissing(obj[key], missingVal);
  }
  return newObj;
}

// target is the object we are mutating (e.g., 'ar')
// source is the reference object (e.g., 'en')
function merge(source, target, missingVal, pathStr = '') {
  for (const key of Object.keys(source)) {
    const currentPath = pathStr ? `${pathStr}.${key}` : key;

    if (target[key] === undefined) {
      console.log(`[MISSING] Adding key '${currentPath}' to target.`);
      if (typeof source[key] === 'object' && source[key] !== null) {
        target[key] = markLeavesAsMissing(source[key], missingVal);
      } else {
        target[key] = missingVal;
      }
    } else if (typeof source[key] === 'object' && source[key] !== null) {
      if (typeof target[key] !== 'object' || target[key] === null) {
        console.error(`[TYPE MISMATCH] Key '${currentPath}' is object in source but not in target.`);
      } else {
        merge(source[key], target[key], missingVal, currentPath);
      }
    }
  }
}

// 3. Sync Logic (Cross-pollinate all)
// We compare every file against every other file to ensure total completeness.
files.forEach((sourceFile) => {
  files.forEach((targetFile) => {
    if (sourceFile === targetFile) return;

    console.log(`Syncing ${sourceFile} -> ${targetFile}...`);
    merge(translations[sourceFile], translations[targetFile], '__MISSING_TRANSLATION__');
  });
});

// 4. Sort and Write Back
files.forEach((file) => {
  console.log(`Sorting and writing ${file}...`);
  const sorted = sortObject(translations[file]);
  writeFileSync(join(i18nDir, file), JSON.stringify(sorted, null, 2) + '\n');
});

console.log('Sync complete.');
