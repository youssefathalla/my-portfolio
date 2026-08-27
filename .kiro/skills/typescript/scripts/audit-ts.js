/**
 * Run: node scripts/audit-ts.js --help
 */
import fs from 'node:fs';
import path from 'node:path';

const BANNED = [
  { regex: /: any/, msg: "❌ Forbidden: ': any'. Use 'unknown'." },
  { regex: /private \w+/, msg: "⚠️ Legacy: Use '#' syntax for private fields." },
  { regex: /public \w+ = signal/, msg: '⚠️ Unsafe: Expose signals as .asReadonly().' },
];

function scan(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((f) => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory() && f !== 'node_modules') scan(full);
    else if (full.endsWith('.ts') || full.endsWith('.html')) {
      const content = fs.readFileSync(full, 'utf8');
      BANNED.forEach((c) => {
        if (c.regex.test(content)) console.log(`${c.msg}\n   at ${full}`);
      });
    }
  });
}

const target = process.argv[2];
if (!target || target === '--help') {
  console.log('Usage: node audit-ts.js [directory]');
} else {
  scan(target);
}
