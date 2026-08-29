/**
 * Antigravity PostToolUse hook — mirrors `.kiro/` into `.agents/` after any file write.
 *
 * Antigravity has no file-save event, so the closest equivalent to Kiro's PostFileSave is
 * PostToolUse on the write tools. The matcher can only target tool names, and PostToolUse
 * input carries no path, so path filtering lives in the sync script itself: it only ever
 * reads `.kiro/` and is a no-op when nothing changed.
 *
 * PostToolUse must emit `{}` on stdout, so the sync summary goes to stderr instead. This
 * hook never fails the agent loop — a broken mirror is reported, not thrown.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const SYNC_SCRIPT = join('scripts', 'sync-agent-docs.mjs');

function readStdin() {
  return new Promise((resolve) => {
    let raw = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (raw += chunk));
    process.stdin.on('end', () => resolve(raw));
    process.stdin.on('error', () => resolve(''));
  });
}

function done(note) {
  if (note) process.stderr.write(`${note}\n`);
  process.stdout.write('{}');
  process.exit(0);
}

const raw = await readStdin();

let payload = {};
try {
  payload = raw ? JSON.parse(raw) : {};
} catch {
  /* fall through to cwd */
}

// Prefer the workspace the agent reported; fall back to the process cwd.
const workspace =
  Array.isArray(payload.workspacePaths) && payload.workspacePaths.length > 0
    ? payload.workspacePaths[0]
    : process.cwd();

if (!existsSync(join(workspace, SYNC_SCRIPT))) {
  done(`agent-docs sync skipped: ${SYNC_SCRIPT} not found in ${workspace}`);
}

// Invoke node directly rather than `npm run` — no shell quoting, works on Windows.
const result = spawnSync(process.execPath, [SYNC_SCRIPT], {
  cwd: workspace,
  encoding: 'utf8',
  timeout: 20_000,
});

const summary = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
done(summary ? `agent-docs sync:\n${summary}` : 'agent-docs sync: no output');
