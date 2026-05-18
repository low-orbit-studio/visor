import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const SCRIPT = join(__dirname, '..', 'validate-changesets.mjs');

// Use a stable, sortable prefix so the synthetic changeset doesn't collide
// alphabetically with real changesets in the directory.
const SYNTHETIC = join(REPO_ROOT, '.changeset', 'zz-validate-changesets-test.md');

function runValidator() {
  return spawnSync('node', [SCRIPT], { cwd: REPO_ROOT, encoding: 'utf8' });
}

describe('validate-changesets.mjs', () => {
  afterEach(() => {
    if (existsSync(SYNTHETIC)) unlinkSync(SYNTHETIC);
  });

  it('passes (exit 0) on the current repo state', () => {
    // Sanity: the repo's actual .changeset/*.md files should always validate.
    // If this fails, there is a real malformed changeset on the branch — fix
    // it before pushing rather than working around the test.
    const result = runValidator();
    expect(result.status).toBe(0);
  });

  it('fails (exit 1) on the VI-418 failure mode — unknown package name', () => {
    writeFileSync(
      SYNTHETIC,
      '---\n"bogus-package": patch\n---\n\nSynthetic test changeset for validate-changesets.mjs.\n',
    );
    const result = runValidator();
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/not in the workspace/);
    expect(result.stderr).toMatch(/Changeset validation failed/);
  });

  it('fails (exit 1) when frontmatter references the workspace root (private package)', () => {
    // The exact VI-418 mistake: changesets used "visor" (the workspace root,
    // which is private) instead of "@loworbitstudio/visor".
    writeFileSync(
      SYNTHETIC,
      '---\n"visor": minor\n---\n\nSynthetic test — workspace root is private and not publishable.\n',
    );
    const result = runValidator();
    expect(result.status).toBe(1);
  });
});
