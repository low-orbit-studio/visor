import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PACKAGES,
  SHIPPING_PATHS,
  GENERATED_MARKER,
  hasPublishedPackageChanges,
  hasOperatorChangeset,
  deriveSlug,
  parseClaudeOutput,
  run,
} from '../generate-changeset.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

// ---------------------------------------------------------------------------
// hasPublishedPackageChanges
// ---------------------------------------------------------------------------

describe('hasPublishedPackageChanges', () => {
  // -- Published-package src trees (4 entries from changeset-paths.json) --

  it('returns true when tokens package src file changes', () => {
    expect(hasPublishedPackageChanges(['packages/tokens/src/index.ts'])).toBe(true);
  });

  it('returns true when cli package src file changes', () => {
    expect(hasPublishedPackageChanges(['packages/cli/src/commands/add.ts'])).toBe(true);
  });

  it('returns true when theme-engine package src file changes', () => {
    expect(hasPublishedPackageChanges(['packages/theme-engine/src/index.ts'])).toBe(true);
  });

  it('returns true when visor-flutter lib file changes', () => {
    expect(hasPublishedPackageChanges(['packages/visor-flutter/lib/visor.dart'])).toBe(true);
  });

  // -- Registry copy-and-own surfaces (8 entries) --

  it('returns true when a components/ file changes', () => {
    expect(hasPublishedPackageChanges(['components/ui/button.tsx'])).toBe(true);
  });

  it('returns true when a blocks/ file changes', () => {
    expect(
      hasPublishedPackageChanges(['blocks/design-system-specimen/specimen-data.ts']),
    ).toBe(true);
  });

  it('returns true when a hooks/ file changes', () => {
    expect(hasPublishedPackageChanges(['hooks/use-theme.ts'])).toBe(true);
  });

  it('returns true when a lib/ file changes', () => {
    expect(hasPublishedPackageChanges(['lib/utils.ts'])).toBe(true);
  });

  it('returns true when a registry/ file changes', () => {
    expect(hasPublishedPackageChanges(['registry/styles/default/ui/button.ts'])).toBe(true);
  });

  it('returns true when a themes/ file changes', () => {
    expect(hasPublishedPackageChanges(['themes/nimbus.css'])).toBe(true);
  });

  it('returns true when a patterns/ file changes', () => {
    expect(hasPublishedPackageChanges(['patterns/dialog-with-form.tsx'])).toBe(true);
  });

  it('returns true when an assets/ file changes', () => {
    expect(hasPublishedPackageChanges(['assets/logo.svg'])).toBe(true);
  });

  // -- Tooling-only paths that must NOT flag (regressions from the old impl) --

  it('returns false when only packages/cli tooling (non-src) changed', () => {
    // Regression: the old impl matched all of packages/cli/**.
    expect(hasPublishedPackageChanges(['packages/cli/scripts/release.ts'])).toBe(false);
  });

  it('returns false when only packages/cli/package.json changed', () => {
    expect(hasPublishedPackageChanges(['packages/cli/package.json'])).toBe(false);
  });

  it('returns false when only packages/visor-flutter test files changed', () => {
    // visor-flutter ships lib/**, not test/**.
    expect(hasPublishedPackageChanges(['packages/visor-flutter/test/visor_test.dart'])).toBe(false);
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

  it('returns true for mixed list with at least one shipping-path file', () => {
    expect(
      hasPublishedPackageChanges([
        'docs/roadmap.md',
        'packages/tokens/src/primitives.css',
        'README.md',
      ]),
    ).toBe(true);
  });

  // -- Prefix-boundary regressions --

  it('does not confuse "lib/" with prefix-extended directories like "libfoo/"', () => {
    expect(hasPublishedPackageChanges(['libfoo/index.ts'])).toBe(false);
    expect(hasPublishedPackageChanges(['library/index.ts'])).toBe(false);
  });

  it('does not confuse "themes/" with "themes-private/" or "themes.css"', () => {
    expect(hasPublishedPackageChanges(['themes-private/index.ts'])).toBe(false);
    expect(hasPublishedPackageChanges(['themes.css'])).toBe(false);
  });

  it('does not match a file at the exact prefix boundary (no trailing slash)', () => {
    // `themes` (a hypothetical file) is not `themes/...`.
    expect(hasPublishedPackageChanges(['themes'])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SHIPPING_PATHS — single source of truth for the changeset gate
// ---------------------------------------------------------------------------

describe('SHIPPING_PATHS', () => {
  it('exposes the list from changeset-paths.json', () => {
    const raw = JSON.parse(
      readFileSync(join(REPO_ROOT, 'changeset-paths.json'), 'utf8'),
    );
    expect(SHIPPING_PATHS).toEqual(raw.shippingPaths);
  });

  it('every pattern ends in "/**" so prefix-matching is sound', () => {
    for (const pattern of SHIPPING_PATHS) {
      expect(pattern.endsWith('/**')).toBe(true);
    }
  });

  it('contains all path families called out in the ticket', () => {
    const required = [
      'components/**',
      'blocks/**',
      'hooks/**',
      'lib/**',
      'registry/**',
      'themes/**',
      'patterns/**',
      'assets/**',
      'packages/cli/src/**',
      'packages/theme-engine/src/**',
      'packages/visor-flutter/lib/**',
      'packages/tokens/src/**',
    ];
    for (const pattern of required) {
      expect(SHIPPING_PATHS).toContain(pattern);
    }
  });

  it('is non-empty', () => {
    expect(SHIPPING_PATHS.length).toBeGreaterThan(0);
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

  it('flags as requiring a changeset when only a blocks/ file changed', async () => {
    // [auto] verification: editing a file in blocks/ must flag (matches CI gate).
    const result = await run(
      makeDefaults({
        getChangedFiles: () => ['blocks/design-system-specimen/specimen-data.ts'],
      }),
    );
    expect(result.skipped).toBe(false);
    expect(result.bumpType).toBe('minor');
  });

  it('does NOT flag when only packages/cli/scripts/ (tooling) changed', async () => {
    // [auto] verification: tooling-only edits must not flag (CI scopes to /src/**).
    const result = await run(
      makeDefaults({ getChangedFiles: () => ['packages/cli/scripts/release.ts'] }),
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
});
