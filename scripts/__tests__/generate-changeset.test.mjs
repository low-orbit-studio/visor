import { describe, it, expect, vi } from 'vitest';
import {
  PACKAGES,
  GENERATED_MARKER,
  hasPublishedPackageChanges,
  hasOperatorChangeset,
  deriveSlug,
  parseClaudeOutput,
  run,
} from '../generate-changeset.mjs';

// ---------------------------------------------------------------------------
// hasPublishedPackageChanges
// ---------------------------------------------------------------------------

describe('hasPublishedPackageChanges', () => {
  it('returns true when tokens package file changes', () => {
    expect(hasPublishedPackageChanges(['packages/tokens/src/index.ts'])).toBe(true);
  });

  it('returns true when cli package file changes', () => {
    expect(hasPublishedPackageChanges(['packages/cli/src/commands/add.ts'])).toBe(true);
  });

  it('returns true when theme-engine package file changes', () => {
    expect(hasPublishedPackageChanges(['packages/theme-engine/src/index.ts'])).toBe(true);
  });

  it('returns false when only docs changed', () => {
    expect(hasPublishedPackageChanges(['packages/docs/content/button.mdx'])).toBe(false);
  });

  it('returns false when only root-level files changed', () => {
    expect(hasPublishedPackageChanges(['README.md', '.changeset/config.json'])).toBe(false);
  });

  it('returns false when only scripts changed', () => {
    expect(hasPublishedPackageChanges(['scripts/generate-changeset.mjs'])).toBe(false);
  });

  it('returns false for empty list', () => {
    expect(hasPublishedPackageChanges([])).toBe(false);
  });

  it('returns true for mixed list with at least one package file', () => {
    expect(
      hasPublishedPackageChanges([
        'docs/roadmap.md',
        'packages/tokens/src/primitives.css',
        'README.md',
      ]),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// hasOperatorChangeset
// ---------------------------------------------------------------------------

describe('hasOperatorChangeset', () => {
  const markedContent = `---\n${GENERATED_MARKER}\n"@loworbitstudio/visor-core": minor\n---\n\nSome description.`;
  const operatorContent = `---\n"@loworbitstudio/visor-core": minor\n---\n\nHuman-written description.`;

  it('returns false when changeset list is empty', () => {
    expect(hasOperatorChangeset([])).toBe(false);
  });

  it('returns false when the only changeset is auto-generated', () => {
    const readFile = () => markedContent;
    expect(hasOperatorChangeset(['/repo/.changeset/some-slug.md'], readFile)).toBe(false);
  });

  it('returns true when a changeset lacks the generated marker', () => {
    const readFile = () => operatorContent;
    expect(hasOperatorChangeset(['/repo/.changeset/manual.md'], readFile)).toBe(true);
  });

  it('returns true when at least one of multiple changesets is operator-authored', () => {
    const readFile = (path) =>
      path.includes('manual') ? operatorContent : markedContent;
    expect(
      hasOperatorChangeset(
        ['/repo/.changeset/auto.md', '/repo/.changeset/manual.md'],
        readFile,
      ),
    ).toBe(true);
  });

  it('ignores README.md files', () => {
    const readFile = () => { throw new Error('should not be read'); };
    expect(hasOperatorChangeset(['/repo/.changeset/README.md'], readFile)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// deriveSlug
// ---------------------------------------------------------------------------

describe('deriveSlug', () => {
  it('lowercases the branch name', () => {
    expect(deriveSlug(() => 'VI-338-Feat-Something')).toBe('vi-338-feat-something');
  });

  it('replaces non-alphanumeric characters with hyphens', () => {
    expect(deriveSlug(() => 'vi/338_feat something')).toBe('vi-338-feat-something');
  });

  it('trims leading and trailing hyphens', () => {
    expect(deriveSlug(() => '-vi-338-')).toBe('vi-338');
  });

  it('truncates to 60 characters', () => {
    const longBranch = 'vi-338-' + 'a'.repeat(100);
    expect(deriveSlug(() => longBranch)).toHaveLength(60);
  });

  it('falls back to timestamp slug when getBranch throws', () => {
    const slug = deriveSlug(() => { throw new Error('no git'); });
    expect(slug).toMatch(/^lo-changeset-\d+$/);
  });
});

// ---------------------------------------------------------------------------
// parseClaudeOutput
// ---------------------------------------------------------------------------

describe('parseClaudeOutput', () => {
  const validMinor = `---
# generated-by: lo-changeset
"@loworbitstudio/visor-core": minor
---

Add new spacing tokens to the scale.`;

  const validPatch = `---
# generated-by: lo-changeset
"@loworbitstudio/visor-core": patch
---

Fix typo in token comment.`;

  const validMajor = `---
# generated-by: lo-changeset
"@loworbitstudio/visor-core": major
---

Remove deprecated token aliases.`;

  const validMultiple = `---
# generated-by: lo-changeset
"@loworbitstudio/visor-core": minor
"@loworbitstudio/visor": patch
---

Add token, update CLI help text.`;

  it('parses a valid minor changeset', () => {
    const result = parseClaudeOutput(validMinor);
    expect(result).not.toBeNull();
    expect(result.bumpType).toBe('minor');
    expect(result.content).toBe(validMinor);
  });

  it('parses a valid patch changeset', () => {
    const result = parseClaudeOutput(validPatch);
    expect(result).not.toBeNull();
    expect(result.bumpType).toBe('patch');
  });

  it('parses a major bump', () => {
    const result = parseClaudeOutput(validMajor);
    expect(result).not.toBeNull();
    expect(result.bumpType).toBe('major');
  });

  it('picks the highest bump type when multiple packages are present', () => {
    const result = parseClaudeOutput(validMultiple);
    expect(result).not.toBeNull();
    expect(result.bumpType).toBe('minor'); // minor > patch
  });

  it('returns null for SKIP', () => {
    expect(parseClaudeOutput('SKIP')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseClaudeOutput('')).toBeNull();
  });

  it('returns null when there is no frontmatter', () => {
    expect(parseClaudeOutput('Just a plain sentence.')).toBeNull();
  });

  it('trims surrounding whitespace before parsing', () => {
    const result = parseClaudeOutput('\n  ' + validMinor + '  \n');
    expect(result).not.toBeNull();
    expect(result.bumpType).toBe('minor');
  });
});

// ---------------------------------------------------------------------------
// run() — integration-style tests using injected dependencies
// ---------------------------------------------------------------------------

describe('run()', () => {
  const noop = () => {};
  const systemPrompt = 'You are a changeset author.';
  const exampleDiff = 'diff --git a/packages/tokens/src/index.ts b/packages/tokens/src/index.ts\n+export const foo = 1;';
  const exampleClaudeOutput = `---
# generated-by: lo-changeset
"@loworbitstudio/visor-core": minor
---

Add foo export to tokens.`;

  function makeDefaults(overrides = {}) {
    return {
      getChangedFiles: () => ['packages/tokens/src/index.ts'],
      getFullDiff: () => exampleDiff,
      getExistingChangesetFiles: () => [],
      claudeAvailable: () => true,
      invokeClaudeImpl: () => exampleClaudeOutput,
      writeOutput: noop,
      log: noop,
      ...overrides,
    };
  }

  it('generates a changeset when published packages changed and claude is available', async () => {
    const written = [];
    const result = await run(
      makeDefaults({ writeOutput: (p, c) => written.push({ p, c }) }),
    );
    expect(result.skipped).toBe(false);
    expect(result.bumpType).toBe('minor');
    expect(written).toHaveLength(1);
  });

  it('skips when no published-package files changed (docs-only)', async () => {
    const result = await run(
      makeDefaults({ getChangedFiles: () => ['packages/docs/content/button.mdx'] }),
    );
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('no-published-changes');
  });

  it('skips when operator-authored changeset already exists', async () => {
    const operatorContent = '---\n"@loworbitstudio/visor-core": minor\n---\n\nHuman.';
    const result = await run(
      makeDefaults({
        getExistingChangesetFiles: () => ['/repo/.changeset/manual.md'],
        readFile: () => operatorContent,
      }),
    );
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('operator-changeset-exists');
  });

  it('skips with warning when claude is not on PATH', async () => {
    const logs = [];
    const result = await run(
      makeDefaults({
        claudeAvailable: () => false,
        log: (msg) => logs.push(msg),
      }),
    );
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('claude-not-available');
    expect(logs.some(l => l.includes('WARNING'))).toBe(true);
  });

  it('skips gracefully when claude invocation fails (exit 0 — push proceeds)', async () => {
    const logs = [];
    const result = await run(
      makeDefaults({
        invokeClaudeImpl: () => { throw new Error('claude crashed'); },
        log: (msg) => logs.push(msg),
      }),
    );
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('claude-error');
    expect(logs.some(l => l.includes('WARNING'))).toBe(true);
  });

  it('skips when claude returns SKIP', async () => {
    const result = await run(
      makeDefaults({ invokeClaudeImpl: () => 'SKIP' }),
    );
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('claude-skip');
  });

  it('overwrites a prior auto-generated changeset (same slug)', async () => {
    const markedContent = `---\n${GENERATED_MARKER}\n"@loworbitstudio/visor-core": minor\n---\n\nOld.`;
    const written = [];
    const result = await run(
      makeDefaults({
        getExistingChangesetFiles: () => ['/repo/.changeset/auto.md'],
        readFile: () => markedContent,
        writeOutput: (p, c) => written.push({ p, c }),
      }),
    );
    // auto-generated file doesn't block generation; it should proceed and write
    expect(result.skipped).toBe(false);
    expect(written).toHaveLength(1);
  });

  it('skips when diff is empty', async () => {
    const result = await run(
      makeDefaults({ getFullDiff: () => '' }),
    );
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('empty-diff');
  });
});

// ---------------------------------------------------------------------------
// PACKAGES list — spot checks
// ---------------------------------------------------------------------------

describe('PACKAGES', () => {
  it('contains visor-core at packages/tokens', () => {
    const pkg = PACKAGES.find(p => p.name === '@loworbitstudio/visor-core');
    expect(pkg).toBeDefined();
    expect(pkg.dir).toBe('packages/tokens');
  });

  it('contains visor CLI at packages/cli', () => {
    const pkg = PACKAGES.find(p => p.name === '@loworbitstudio/visor');
    expect(pkg).toBeDefined();
    expect(pkg.dir).toBe('packages/cli');
  });

  it('contains theme-engine at packages/theme-engine', () => {
    const pkg = PACKAGES.find(p => p.name === '@loworbitstudio/visor-theme-engine');
    expect(pkg).toBeDefined();
    expect(pkg.dir).toBe('packages/theme-engine');
  });

  it('matches the PACKAGES list in auto-version.mjs (no drift)', async () => {
    const { PACKAGES: autoVersionPackages } = await import('../auto-version.mjs');
    expect(PACKAGES.map(p => p.name).sort()).toEqual(
      autoVersionPackages.map(p => p.name).sort(),
    );
    expect(PACKAGES.map(p => p.dir).sort()).toEqual(
      autoVersionPackages.map(p => p.dir).sort(),
    );
  });
});
