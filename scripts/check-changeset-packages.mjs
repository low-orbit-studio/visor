#!/usr/bin/env node
/**
 * check-changeset-packages.mjs
 *
 * Asserts that a PR's changesets declare the packages whose code the PR
 * touched — the VI-647 gate.
 *
 * Why this exists when three gates already passed the VI-638 incident:
 *
 *   changeset-gate job 1 (presence)     — "is a changeset present?"          PR had one.
 *   scripts/validate-changesets.mjs     — "does it name a real package?"     `@loworbitstudio/visor` is real.
 *   scripts/visor-publish-smoke.mjs     — only covers the CLI.               No engine coverage.
 *
 * None of them asks the one question that mattered: *does it name the package
 * whose code this PR touched?* VI-638 (#716) and VI-639 (#717) changed
 * `packages/theme-engine/src/generate-css.ts` and both declared
 * `"@loworbitstudio/visor"`. Version Packages #718 released the CLI;
 * `visor-theme-engine` stayed at 0.19.0 and the fixes never reached npm.
 *
 * This is the sibling of W030 (a changeset naming a package not in the
 * workspace), and strictly harder to catch: every structural check passes.
 *
 * Ownership is asserted as set membership, not equality (D3). A PR touching
 * two packages passes with one changeset per package; a PR touching the engine
 * and naming only the CLI fails. Extra declared packages are not an error —
 * that is a release-scope choice, not a correctness bug.
 *
 * Exit codes: 0 = ok, 1 = a touched package has no changeset naming it.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadShippingMap, ownersForChangedFiles, REPO_ROOT } from './changeset-paths.mjs';

/**
 * Package names declared in a changeset's YAML frontmatter.
 *
 * The frontmatter is a flat `"<pkg>": <bump>` map, optionally carrying the
 * `# generated-by: lo-changeset` marker comment (D5 of scripts/generate-changeset.mjs).
 * Parsed directly rather than via a YAML dependency so the gate has no install
 * step beyond `npm ci`, and so a malformed bump type still surfaces here as a
 * missing package rather than a crash — `validate-changesets.mjs` owns the
 * structural complaint.
 *
 * @param {string} content - full .changeset/*.md file contents
 * @returns {string[]} declared package names (may be empty)
 */
export function parseChangesetPackages(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return [];
  const packages = [];
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    // "@scope/name": minor   |   name: patch
    const decl = trimmed.match(/^(?:"([^"]+)"|'([^']+)'|([^:\s]+))\s*:/);
    if (decl) packages.push(decl[1] ?? decl[2] ?? decl[3]);
  }
  return packages;
}

/**
 * Cross-check touched shipping paths against declared packages.
 *
 * @param {object} input
 * @param {string[]} input.changedFiles - repo-relative paths changed by the PR
 * @param {string[]} input.changesetContents - contents of the PR's .changeset/*.md files
 * @param {Record<string, string | null>} input.shippingMap
 * @returns {{ ok: boolean, declared: string[], missing: { package: string, file: string }[] }}
 *   `missing[].file` is one touched file that proves the package was changed —
 *   an actionable citation, not just an assertion.
 */
export function crossCheck({ changedFiles, changesetContents, shippingMap }) {
  const declared = [...new Set(changesetContents.flatMap(parseChangesetPackages))];
  const declaredSet = new Set(declared);
  const missing = [];
  for (const [pkg, files] of ownersForChangedFiles(changedFiles, shippingMap)) {
    if (!declaredSet.has(pkg)) missing.push({ package: pkg, file: files[0] });
  }
  return { ok: missing.length === 0, declared, missing };
}

// -- git plumbing (not exercised by unit tests; the pure core above is) --

function gitLines(args) {
  const out = execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  return out.split('\n').map(s => s.trim()).filter(Boolean);
}

function resolveBase() {
  const ref = process.env.BASE_REF ?? 'main';
  // CI checks out with fetch-depth: 0, so origin/<base> exists. Locally it may not.
  for (const candidate of [`origin/${ref}`, ref]) {
    try {
      execFileSync('git', ['rev-parse', '--verify', candidate], { cwd: REPO_ROOT, stdio: 'ignore' });
      return candidate;
    } catch { /* try the next candidate */ }
  }
  throw new Error(`could not resolve a base ref (tried origin/${ref} and ${ref})`);
}

function main() {
  const base = resolveBase();
  const changedFiles = gitLines(['diff', '--name-only', `${base}...HEAD`]);

  // Only the changesets THIS PR adds or edits. Reading all of .changeset/ would
  // let a pending changeset authored by unrelated work satisfy the check, which
  // is exactly how the VI-638 shape slips through.
  const changesetFiles = gitLines([
    'diff', '--name-only', '--diff-filter=AM', `${base}...HEAD`, '--', '.changeset/*.md',
  ]).filter(f => !f.endsWith('README.md'));

  const shippingMap = loadShippingMap();
  const changesetContents = changesetFiles.map(f => readFileSync(join(REPO_ROOT, f), 'utf8'));
  const { ok, declared, missing } = crossCheck({ changedFiles, changesetContents, shippingMap });

  if (ok) {
    console.log(
      declared.length
        ? `Changeset package ownership OK (declares: ${declared.join(', ')}).`
        : 'Changeset package ownership OK (no owned shipping paths touched).',
    );
    return 0;
  }

  console.error('::error::This PR changes code owned by a package that none of its changesets declare.');
  console.error('');
  for (const { package: pkg, file } of missing) {
    console.error(`  ${file} changed but no changeset names ${pkg}`);
  }
  console.error('');
  console.error(`Declared by this PR's changesets: ${declared.length ? declared.join(', ') : '(none)'}`);
  console.error(`Changesets inspected: ${changesetFiles.length ? changesetFiles.join(', ') : '(none)'}`);
  console.error('');
  console.error('Add or amend a changeset so every touched package is declared:');
  console.error('');
  console.error('  npm run changeset');
  console.error('');
  console.error('A PR may declare more packages than it touches — that is a release-scope');
  console.error('choice. It may not declare fewer: an undeclared package is never bumped,');
  console.error('so the change sits on main unpublished (VI-646, W020).');
  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exit(main());
  } catch (err) {
    console.error(`::error::[check-changeset-packages] ${err.message}`);
    process.exit(1);
  }
}
