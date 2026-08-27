/**
 * Run: node scripts/audit-store.js [path]
 * Checks for: 'inject()' usage outside of 'withProps'
 */
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function scan(dir) {
  const files = readdirSync(dir);
  files.forEach((f) => {
    const full = join(dir, f);
    if (statSync(full).isDirectory() && f !== 'node_modules') scan(full);
    else if (full.endsWith('.ts')) {
      const content = readFileSync(full, 'utf8');

      // Check if file is a Store
      if (content.includes('signalStore')) {
        // 1. Check for inject() inside withMethods
        // Regex looks for withMethods followed by content containing inject(
        const methodInjectRegex = /withMethods\s*\([\s\S]*?inject\(/;
        if (methodInjectRegex.test(content)) {
          console.log(
            `❌ VIOLATION: Found 'inject()' inside 'withMethods'. Move it to 'withProps'.\n   at ${full}`,
          );
        }

        // 2. Check for missing withEntities if managing arrays
        if (content.includes('[]') && !content.includes('withEntities')) {
          console.log(
            `⚠️ WARNING: You seem to be managing an array manually. Consider 'withEntities'.\n   at ${full}`,
          );
        }
      }
    }
  });
}

scan(process.argv[2] || 'src/app');
