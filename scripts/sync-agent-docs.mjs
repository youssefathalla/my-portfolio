/**
 * Mirrors the agent documentation in `.kiro/` into `.agents/`.
 *
 *   node scripts/sync-agent-docs.mjs           # write
 *   node scripts/sync-agent-docs.mjs --check   # report drift, exit 1 if any (CI)
 *
 * Why this exists: Kiro reads `.kiro/`, other agents read `.agents/`. The two trees must
 * carry the same instructions, but NOT the same front matter — each tool has its own
 * dialect (`inclusion: fileMatch` vs `trigger: glob`, etc.). So:
 *
 *   - skills/**            copied verbatim (identical format in both trees)
 *   - steering -> rules    body synced, destination front matter preserved
 *   - steering -> workflows  body synced, destination front matter preserved
 *
 * `.kiro/` is always the source of truth. Never edit `.agents/` by hand.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';

const CHECK_ONLY = process.argv.includes('--check');

/** Files whose body is mirrored but whose front matter belongs to the destination tool. */
const BODY_ONLY = [
  { from: '.kiro/steering/design-system.md', to: '.agents/rules/design-system.md' },
  { from: '.kiro/steering/ask.md', to: '.agents/workflows/ask.md' },
  { from: '.kiro/steering/teacher.md', to: '.agents/workflows/teacher.md' },
  { from: '.kiro/steering/translater.md', to: '.agents/workflows/translater.md' },
];

/** Directories mirrored verbatim, front matter included. */
const VERBATIM = [{ from: '.kiro/skills', to: '.agents/skills' }];

const FRONT_MATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;

const changed = [];
const problems = [];

const read = (p) => readFileSync(p, 'utf8');

function splitFrontMatter(text, label) {
  const match = text.match(FRONT_MATTER);
  if (!match) {
    problems.push(`${label}: no YAML front matter found`);
    return null;
  }
  return { frontMatter: match[0], body: text.slice(match[0].length) };
}

function write(destination, contents) {
  if (CHECK_ONLY) return;
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, contents);
}

function syncBodyOnly({ from, to }) {
  if (!existsSync(from)) return problems.push(`${from}: source missing`);
  if (!existsSync(to))
    return problems.push(`${to}: destination missing — create it with its own front matter first`);

  const source = splitFrontMatter(read(from), from);
  const destination = splitFrontMatter(read(to), to);
  if (!source || !destination) return;

  const merged = destination.frontMatter + source.body;
  if (merged !== read(to)) {
    changed.push(to);
    write(to, merged);
  }
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function syncVerbatim({ from, to }) {
  if (!existsSync(from)) return problems.push(`${from}: source missing`);

  const sourceFiles = walk(from);
  for (const file of sourceFiles) {
    const destination = join(to, relative(from, file));
    const contents = readFileSync(file);
    if (!existsSync(destination) || !contents.equals(readFileSync(destination))) {
      changed.push(destination);
      write(destination, contents);
    }
  }

  // Report files that exist only in the mirror. Deleting is left to a human on purpose.
  if (existsSync(to)) {
    const expected = new Set(sourceFiles.map((f) => relative(from, f)));
    for (const file of walk(to)) {
      const rel = relative(to, file);
      if (!expected.has(rel))
        problems.push(`${join(to, rel)}: orphaned (no counterpart in ${from})`);
    }
  }
}

BODY_ONLY.forEach(syncBodyOnly);
VERBATIM.forEach(syncVerbatim);

const label = (p) => p.split(sep).join('/');

if (problems.length) {
  console.error('⚠️  Problems:');
  problems.forEach((p) => console.error(`   ${p}`));
}

if (changed.length === 0) {
  console.log('✅ .agents/ is in sync with .kiro/');
} else if (CHECK_ONLY) {
  console.error(`\n❌ ${changed.length} file(s) out of sync. Run: npm run sync:agents`);
  changed.forEach((f) => console.error(`   ${label(f)}`));
} else {
  console.log(`✅ Synced ${changed.length} file(s):`);
  changed.forEach((f) => console.log(`   ${label(f)}`));
}

const failed = problems.length > 0 || (CHECK_ONLY && changed.length > 0);
process.exit(failed ? 1 : 0);
