#!/usr/bin/env node
/**
 * generate-changeset.mjs
 *
 * Generates a .changeset/<slug>.md file for the current branch by reading
 * the git diff vs main and asking Claude to write the changeset content.
 *
 * Called by:
 *   - .husky/pre-push   (automatic, on every push of a feature branch)
 *   - .claude/skills/lo-changeset/SKILL.md (on-demand via /lo-changeset)
 *
 * Decisions:
 *   D2 — skip if no published-package files changed
 *   D4 — skip if an operator-authored (non-generated) changeset already exists
 *   D5 — auto-generated changesets include "# generated-by: lo-changeset" in frontmatter
 *   D7 — if claude is unavailable, print warning and exit 0 (push proceeds)
 *   D8 — progress messages: [lo-changeset] prefix
 */

import { execSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const CHANGESET_DIR = join(REPO_ROOT, '.changeset');
const PROMPT_FILE = join(__dirname, 'changeset-prompt.md');
const SHIPPING_PATHS_FILE = join(REPO_ROOT, 'changeset-paths.json');
export const GENERATED_MARKER = '# generated-by: lo-changeset';

// -- Published packages -- dir→npm-name mapping. Used to render changeset
// frontmatter (`"@loworbitstudio/visor-core": patch`). Distinct from
// SHIPPING_PATHS below (which covers the broader "what requires a changeset"
// surface, including copy-and-own registry paths like blocks/ and themes/).
export const PACKAGES = [
  { dir: 'packages/tokens', name: '@loworbitstudio/visor-core' },
  { dir: 'packages/cli', name: '@loworbitstudio/visor' },
  { dir: 'packages/theme-engine', name: '@loworbitstudio/visor-theme-engine' },
];

// -- Shipping paths -- single source of truth shared with .github/workflows/changeset-gate.yml.
// Loaded from changeset-paths.json at repo root. Every pattern must end in '/**'
// so we can match with a simple prefix check (no glob dependency).
function _loadShippingPaths() {
  let raw;
  try {
    raw = readFileSync(SHIPPING_PATHS_FILE, 'utf8');
  } catch (err) {
    throw new Error(
      `[generate-changeset] could not read ${SHIPPING_PATHS_FILE}: ${err.message}. ` +
      `This file is the single source of truth for the changeset gate — it must exist at repo root.`,
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`[generate-changeset] ${SHIPPING_PATHS_FILE} is not valid JSON: ${err.message}`);
  }
  if (!Array.isArray(parsed.shippingPaths) || parsed.shippingPaths.length === 0) {
    throw new Error(
      `[generate-changeset] ${SHIPPING_PATHS_FILE} must define a non-empty "shippingPaths" array.`,
    );
  }
  for (const pattern of parsed.shippingPaths) {
    if (typeof pattern !== 'string' || !pattern.endsWith('/**')) {
      throw new Error(
        `[generate-changeset] changeset-paths.json pattern ${JSON.stringify(pattern)} must be a string ending in "/**". ` +
        `If you need a non-recursive pattern, update hasPublishedPackageChanges to use a real glob matcher.`,
      );
    }
  }
  return parsed.shippingPaths;
}

// Load at module-import time, but never throw — the local pre-push hook is
// contractually "never block the push" (D7). Surface any error via run()'s
// log channel instead. CI has its own loud check in the workflow.
let _shippingLoadError = null;
function _safeLoadShippingPaths() {
  try {
    return _loadShippingPaths();
  } catch (err) {
    _shippingLoadError = err;
    return [];
  }
}
export const SHIPPING_PATHS = _safeLoadShippingPaths();
const SHIPPING_PREFIXES = SHIPPING_PATHS.map(p => p.slice(0, -2)); // strip trailing '**', keep trailing '/'

// -- Pure helpers (exported for testing) --

/**
 * Returns true if any file in changedFiles matches a shipping-path pattern
 * from changeset-paths.json. Patterns are `prefix/**` and matched by prefix.
 * @param {string[]} changedFiles - list of repo-relative file paths
 * @returns {boolean}
 */
export function hasPublishedPackageChanges(changedFiles) {
  return SHIPPING_PREFIXES.some(prefix =>
    changedFiles.some(f => f.startsWith(prefix)),
  );
}

/**
 * Reads all existing .changeset/*.md files and returns whether there is at
 * least one operator-authored (non-generated) changeset present.
 *
 * A generated changeset contains the GENERATED_MARKER string.
 * An operator-authored changeset does NOT contain that marker.
 *
 * @param {string[]} existingChangesetFiles - absolute paths to .changeset/*.md
 * @param {(path: string) => string} readFile - injected for testing
 * @returns {boolean}
 */
export function hasOperatorChangeset(existingChangesetFiles, readFile = readFileSync) {
  return existingChangesetFiles
    .filter(f => f.endsWith('.md') && !f.endsWith('README.md'))
    .some(f => {
      const content = readFile(f, 'utf8');
      return !content.includes(GENERATED_MARKER);
    });
}

/**
 * Derives a slug for the changeset filename from the current git branch name.
 * Falls back to a timestamp-based slug if branch detection fails.
 * @param {() => string} getBranch - injected for testing
 * @returns {string}
 */
export function deriveSlug(getBranch = _getBranchName) {
  try {
    const branch = getBranch().trim();
    return branch
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
  } catch {
    return `lo-changeset-${Date.now()}`;
  }
}

/**
 * Parses the Claude output and returns { content, bumpType }.
 * Returns null if the output is "SKIP" or unparseable.
 * @param {string} output
 * @returns {{ content: string; bumpType: string } | null}
 */
export function parseClaudeOutput(output) {
  const trimmed = output.trim();
  if (trimmed === 'SKIP' || trimmed === '') return null;

  const frontmatterMatch = trimmed.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  const frontmatter = frontmatterMatch[1];
  const bumpTypes = [];
  for (const line of frontmatter.split('\n')) {
    const m = line.match(/:\s*(major|minor|patch)/);
    if (m) bumpTypes.push(m[1]);
  }

  const priority = { major: 3, minor: 2, patch: 1 };
  const bumpType = bumpTypes.reduce(
    (best, t) => ((priority[t] ?? 0) > (priority[best] ?? 0) ? t : best),
    bumpTypes[0] ?? 'patch',
  );

  return { content: trimmed, bumpType };
}

// -- Private helpers --

function _getBranchName() {
  return execSync('git rev-parse --abbrev-ref HEAD', { cwd: REPO_ROOT, encoding: 'utf8' });
}

function _getChangedFiles() {
  try {
    const raw = execSync('git diff main...HEAD --name-only', {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    return raw.trim().split('\n').filter(Boolean);
  } catch {
    const raw = execSync('git diff origin/main...HEAD --name-only', {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    return raw.trim().split('\n').filter(Boolean);
  }
}

function _getFullDiff() {
  try {
    return execSync('git diff main...HEAD', {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 5 * 1024 * 1024,
    });
  } catch {
    return execSync('git diff origin/main...HEAD', {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 5 * 1024 * 1024,
    });
  }
}

function _getExistingChangesetFiles() {
  if (!existsSync(CHANGESET_DIR)) return [];
  return readdirSync(CHANGESET_DIR)
    .filter(f => f.endsWith('.md') && f !== 'README.md')
    .map(f => join(CHANGESET_DIR, f));
}

function _claudeAvailable() {
  const result = spawnSync('which', ['claude'], { encoding: 'utf8' });
  return result.status === 0;
}

function _invokeClaudeImpl(systemPrompt, diff) {
  const fullPrompt = `${systemPrompt}\n\n## Diff\n\n\`\`\`diff\n${diff}\n\`\`\``;
  const result = spawnSync('claude', ['-p', fullPrompt], {
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024,
    timeout: 60_000,
  });
  if (result.status !== 0) {
    throw new Error(`claude exited with status ${result.status}: ${result.stderr ?? ''}`);
  }
  return result.stdout;
}

function _writeOutput(outputPath, content) {
  writeFileSync(outputPath, content + '\n');
}

function _gitAdd(filePath) {
  try {
    spawnSync('git', ['add', filePath], { cwd: REPO_ROOT, encoding: 'utf8' });
  } catch {
    // Non-fatal
  }
}

// -- Main --

export async function run({
  getChangedFiles = _getChangedFiles,
  getFullDiff = _getFullDiff,
  getExistingChangesetFiles = _getExistingChangesetFiles,
  claudeAvailable = _claudeAvailable,
  invokeClaudeImpl = _invokeClaudeImpl,
  writeOutput = _writeOutput,
  readFile = readFileSync,
  log = console.error,
} = {}) {
  // 0. If shipping-paths config failed to load at module import, warn and skip.
  // D7: never block the push.
  if (_shippingLoadError) {
    log(`[lo-changeset] WARNING: ${_shippingLoadError.message}`);
    log('[lo-changeset] Skipping changeset generation. Push will proceed.');
    return { skipped: true, reason: 'shipping-paths-load-error' };
  }

  // 1. Check if any published packages were touched
  let changedFiles;
  try {
    changedFiles = getChangedFiles();
  } catch (err) {
    log(`[lo-changeset] WARNING: could not determine changed files — ${err.message}`);
    return { skipped: true, reason: 'diff-error' };
  }

  if (!hasPublishedPackageChanges(changedFiles)) {
    log('[lo-changeset] no published-package changes detected — skipping');
    return { skipped: true, reason: 'no-published-changes' };
  }

  // 2. Skip if operator-authored changeset already exists
  const existingFiles = getExistingChangesetFiles();
  if (hasOperatorChangeset(existingFiles, readFile)) {
    log('[lo-changeset] operator-authored changeset found — skipping (operator override wins)');
    return { skipped: true, reason: 'operator-changeset-exists' };
  }

  // 3. Check claude availability
  if (!claudeAvailable()) {
    log('[lo-changeset] WARNING: `claude` not found on PATH — skipping changeset generation');
    log('[lo-changeset] Run `npm run changeset` manually to add a changeset.');
    return { skipped: true, reason: 'claude-not-available' };
  }

  // 4. Derive output filename
  const slug = deriveSlug();
  const filename = `${slug}.md`;
  const outputPath = join(CHANGESET_DIR, filename);

  log(`[lo-changeset] generating .changeset/${filename}...`);

  // 5. Read prompt and diff
  const systemPrompt = readFileSync(PROMPT_FILE, 'utf8');
  let diff;
  try {
    diff = getFullDiff();
  } catch (err) {
    log(`[lo-changeset] WARNING: could not read diff — ${err.message}`);
    return { skipped: true, reason: 'diff-error' };
  }

  if (!diff.trim()) {
    log('[lo-changeset] diff is empty — skipping');
    return { skipped: true, reason: 'empty-diff' };
  }

  // 6. Invoke Claude
  let claudeOutput;
  try {
    claudeOutput = invokeClaudeImpl(systemPrompt, diff);
  } catch (err) {
    log(`[lo-changeset] WARNING: claude invocation failed — ${err.message}`);
    log('[lo-changeset] Skipping changeset generation. Push will proceed.');
    log('[lo-changeset] Run `npm run changeset` manually if this is a minor/major bump.');
    return { skipped: true, reason: 'claude-error' };
  }

  // 7. Parse output
  const parsed = parseClaudeOutput(claudeOutput);
  if (!parsed) {
    log('[lo-changeset] Claude returned SKIP — no changeset needed for this diff');
    return { skipped: true, reason: 'claude-skip' };
  }

  // 8. Write changeset file
  writeOutput(outputPath, parsed.content);
  _gitAdd(outputPath);

  log(`[lo-changeset] wrote .changeset/${filename} (${parsed.bumpType} bump)`);

  return { skipped: false, outputPath, filename, bumpType: parsed.bumpType };
}

// -- CLI entrypoint --
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error(`[lo-changeset] Unexpected error: ${err.message}`);
    process.exit(0); // D7: always exit 0 so push is not blocked
  });
}
