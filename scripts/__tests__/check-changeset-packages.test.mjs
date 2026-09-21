import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseChangesetPackages, crossCheck } from '../check-changeset-packages.mjs';
import { loadShippingMap, ownerFor, ownersForChangedFiles, parseShippingMap } from '../changeset-paths.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

/** The repo's real ownership map — these tests assert against production config. */
const MAP = loadShippingMap();

const changeset = (frontmatter, body = 'Some description.') =>
  `---\n${frontmatter}\n---\n\n${body}\n`;

// ---------------------------------------------------------------------------
// parseChangesetPackages
// ---------------------------------------------------------------------------

describe('parseChangesetPackages', () => {
  it('reads a single scoped package', () => {
    expect(parseChangesetPackages(changeset('"@loworbitstudio/visor": minor')))
      .toEqual(['@loworbitstudio/visor']);
  });

  it('reads multiple packages', () => {
    expect(
      parseChangesetPackages(
        changeset('"@loworbitstudio/visor": minor\n"@loworbitstudio/visor-core": patch'),
      ),
    ).toEqual(['@loworbitstudio/visor', '@loworbitstudio/visor-core']);
  });

  it('skips the lo-changeset generated marker comment', () => {
    expect(
      parseChangesetPackages(
        changeset('# generated-by: lo-changeset\n"@loworbitstudio/visor-core": minor'),
      ),
    ).toEqual(['@loworbitstudio/visor-core']);
  });

  it('reads single-quoted and unquoted names', () => {
    expect(parseChangesetPackages(changeset("'@loworbitstudio/visor': patch")))
      .toEqual(['@loworbitstudio/visor']);
    expect(parseChangesetPackages(changeset('visor: patch'))).toEqual(['visor']);
  });

  it('tolerates CRLF line endings', () => {
    expect(parseChangesetPackages('---\r\n"@loworbitstudio/visor": minor\r\n---\r\n\r\nBody.\r\n'))
      .toEqual(['@loworbitstudio/visor']);
  });

  it('returns [] when there is no frontmatter', () => {
    expect(parseChangesetPackages('Just prose, no frontmatter.')).toEqual([]);
  });

  it('returns [] for an empty frontmatter block', () => {
    expect(parseChangesetPackages('---\n\n---\n\nBody.')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// ownerFor — ownership edges asserted against the real config
// ---------------------------------------------------------------------------

describe('ownerFor', () => {
  it('maps theme-engine source to the theme-engine package', () => {
    expect(ownerFor('packages/theme-engine/src/generate-css.ts', MAP))
      .toBe('@loworbitstudio/visor-theme-engine');
  });

  it('maps tokens source to visor-core', () => {
    expect(ownerFor('packages/tokens/src/tokens/semantic.ts', MAP))
      .toBe('@loworbitstudio/visor-core');
  });

  it('maps CLI source to the CLI package', () => {
    expect(ownerFor('packages/cli/src/commands/add.ts', MAP)).toBe('@loworbitstudio/visor');
  });

  it('maps registry copy-and-own surfaces to the CLI, which bundles them', () => {
    // Confirmed against packages/cli/src/generate/build-registry.ts, which reads
    // these trees into dist/registry.json (D4).
    for (const file of [
      'components/ui/button/button.tsx',
      'blocks/stat-card/stat-card.tsx',
      'hooks/use-theme.ts',
      'lib/utils.ts',
      'registry/registry-ui.ts',
      'patterns/dialog-with-form.visor-pattern.yaml',
    ]) {
      expect(ownerFor(file, MAP)).toBe('@loworbitstudio/visor');
    }
  });

  it('maps stock themes to visor-core, not the CLI', () => {
    // D4 assumed every root-level path belongs to the CLI. themes/ does not:
    // packages/tokens/src/generate/generate-css.ts reads the repo-root themes/
    // dir (STOCK_THEMES_DIR) and emits dist/themes/<slug>.css, which visor-core
    // publishes via its "./themes/<slug>" export. The CLI bundles no theme YAML.
    expect(ownerFor('themes/space.visor.yaml', MAP)).toBe('@loworbitstudio/visor-core');
  });

  it('returns null for shipping paths no npm package publishes', () => {
    // assets/ is README artwork and brand SVGs; visor-flutter publishes to pub.dev.
    // Both still require a changeset, but neither has a package to cross-check.
    expect(ownerFor('assets/brand/visor-logo-dark.svg', MAP)).toBeNull();
    expect(ownerFor('packages/visor-flutter/lib/visor.dart', MAP)).toBeNull();
  });

  it('returns undefined for paths that are not shipping paths at all', () => {
    expect(ownerFor('README.md', MAP)).toBeUndefined();
    expect(ownerFor('packages/cli/package.json', MAP)).toBeUndefined();
    expect(ownerFor('packages/docs/content/docs/cli.mdx', MAP)).toBeUndefined();
    expect(ownerFor('scripts/check-changeset-packages.mjs', MAP)).toBeUndefined();
  });

  it('does not match a sibling directory sharing a name prefix', () => {
    expect(ownerFor('libfoo/index.ts', MAP)).toBeUndefined();
    expect(ownerFor('themes-private/index.ts', MAP)).toBeUndefined();
  });

  it('prefers the longest matching prefix regardless of key order', () => {
    const map = { 'packages/**': '@scope/broad', 'packages/cli/src/**': '@scope/narrow' };
    expect(ownerFor('packages/cli/src/index.ts', map)).toBe('@scope/narrow');
    expect(ownerFor('packages/other/index.ts', map)).toBe('@scope/broad');
  });
});

describe('ownersForChangedFiles', () => {
  it('groups each owned package with a file proving it was touched', () => {
    const owners = ownersForChangedFiles(
      ['packages/theme-engine/src/generate-css.ts', 'packages/cli/src/index.ts', 'README.md'],
      MAP,
    );
    expect([...owners.keys()].sort()).toEqual([
      '@loworbitstudio/visor',
      '@loworbitstudio/visor-theme-engine',
    ]);
    expect(owners.get('@loworbitstudio/visor-theme-engine'))
      .toEqual(['packages/theme-engine/src/generate-css.ts']);
  });

  it('omits unowned and non-shipping paths', () => {
    expect(ownersForChangedFiles(['assets/logo.svg', 'README.md'], MAP).size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// crossCheck — the four controls from VI-647's verification plan
// ---------------------------------------------------------------------------

describe('crossCheck', () => {
  // The real diff of VI-638 (#716), verbatim from `git show 0b0cfd73 --name-only`.
  const VI_638_FILES = [
    'docs/visor-theme.schema.json',
    'packages/docs/app/blackout-theme.css',
    'packages/theme-engine/src/__tests__/vi-638-type-scale-ramp.test.ts',
    'packages/theme-engine/src/adapters/docs.ts',
    'packages/theme-engine/src/adapters/nextjs.ts',
    'packages/theme-engine/src/generate-css.ts',
    'packages/theme-engine/src/types.ts',
    'scripts/validate.ts',
  ];

  it('POSITIVE CONTROL — fails on the VI-638 incident shape', () => {
    // The changeset that actually merged: engine code, CLI declared.
    const result = crossCheck({
      changedFiles: VI_638_FILES,
      changesetContents: [changeset('"@loworbitstudio/visor": minor')],
      shippingMap: MAP,
    });
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([
      {
        package: '@loworbitstudio/visor-theme-engine',
        file: 'packages/theme-engine/src/__tests__/vi-638-type-scale-ramp.test.ts',
      },
    ]);
  });

  it('NEGATIVE CONTROL — passes with the package VI-646 had to declare later', () => {
    const result = crossCheck({
      changedFiles: VI_638_FILES,
      changesetContents: [changeset('"@loworbitstudio/visor-theme-engine": minor')],
      shippingMap: MAP,
    });
    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('MULTI-PACKAGE CONTROL — passes when a two-package diff declares both (D3)', () => {
    const result = crossCheck({
      changedFiles: ['packages/cli/src/index.ts', 'packages/theme-engine/src/generate-css.ts'],
      changesetContents: [
        changeset('"@loworbitstudio/visor": patch'),
        changeset('"@loworbitstudio/visor-theme-engine": minor'),
      ],
      shippingMap: MAP,
    });
    expect(result.ok).toBe(true);
  });

  it('MULTI-PACKAGE CONTROL — one changeset naming both packages also passes', () => {
    const result = crossCheck({
      changedFiles: ['packages/cli/src/index.ts', 'packages/theme-engine/src/generate-css.ts'],
      changesetContents: [
        changeset('"@loworbitstudio/visor": patch\n"@loworbitstudio/visor-theme-engine": minor'),
      ],
      shippingMap: MAP,
    });
    expect(result.ok).toBe(true);
  });

  it('fails a two-package diff that declares only one (set membership, not presence)', () => {
    const result = crossCheck({
      changedFiles: ['packages/cli/src/index.ts', 'packages/theme-engine/src/generate-css.ts'],
      changesetContents: [changeset('"@loworbitstudio/visor": patch')],
      shippingMap: MAP,
    });
    expect(result.ok).toBe(false);
    expect(result.missing.map(m => m.package)).toEqual(['@loworbitstudio/visor-theme-engine']);
  });

  it('allows declaring MORE packages than were touched (D3 — set membership)', () => {
    const result = crossCheck({
      changedFiles: ['packages/theme-engine/src/generate-css.ts'],
      changesetContents: [
        changeset('"@loworbitstudio/visor-theme-engine": minor\n"@loworbitstudio/visor": patch'),
      ],
      shippingMap: MAP,
    });
    expect(result.ok).toBe(true);
  });

  it('passes a PR that touches no owned shipping path and has no changeset', () => {
    const result = crossCheck({
      changedFiles: ['README.md', 'packages/docs/content/docs/cli.mdx'],
      changesetContents: [],
      shippingMap: MAP,
    });
    expect(result.ok).toBe(true);
    expect(result.declared).toEqual([]);
  });

  it('passes an unowned shipping path with a changeset naming anything', () => {
    // assets/** requires a changeset but has no package to assert against.
    const result = crossCheck({
      changedFiles: ['assets/brand/visor-logo-dark.svg'],
      changesetContents: [changeset('"@loworbitstudio/visor": patch')],
      shippingMap: MAP,
    });
    expect(result.ok).toBe(true);
  });

  it('fails a shipping-path change with no changeset at all', () => {
    const result = crossCheck({
      changedFiles: ['packages/tokens/src/tokens/semantic.ts'],
      changesetContents: [],
      shippingMap: MAP,
    });
    expect(result.ok).toBe(false);
    expect(result.missing[0].package).toBe('@loworbitstudio/visor-core');
  });

  it('reports every missing package, not just the first', () => {
    const result = crossCheck({
      changedFiles: ['packages/tokens/src/index.ts', 'packages/theme-engine/src/index.ts'],
      changesetContents: [changeset('"@loworbitstudio/visor": patch')],
      shippingMap: MAP,
    });
    expect(result.missing.map(m => m.package).sort()).toEqual([
      '@loworbitstudio/visor-core',
      '@loworbitstudio/visor-theme-engine',
    ]);
  });
});

// ---------------------------------------------------------------------------
// MUTATION CHECK — a green suite must not be vacuous.
//
// VI-647's verification plan asks that removing the cross-check make the
// positive control fail. Rather than editing the source, this re-runs the
// positive control against the behaviour the gate had BEFORE this ticket:
// "a changeset is present and names a real package". That predicate returns
// true for the VI-638 shape — which is precisely why it shipped.
// ---------------------------------------------------------------------------

describe('mutation check — the pre-VI-647 gate passes the incident', () => {
  const preVI647Gate = (changesetContents) =>
    changesetContents.length > 0 &&
    changesetContents.every(c => parseChangesetPackages(c).length > 0);

  it('the old predicate accepts the VI-638 changeset, the new one rejects it', () => {
    const contents = [changeset('"@loworbitstudio/visor": minor')];
    expect(preVI647Gate(contents)).toBe(true);
    expect(
      crossCheck({
        changedFiles: ['packages/theme-engine/src/generate-css.ts'],
        changesetContents: contents,
        shippingMap: MAP,
      }).ok,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseShippingMap — the config contract
// ---------------------------------------------------------------------------

describe('parseShippingMap', () => {
  it('rejects the pre-VI-647 flat-array form with an actionable message', () => {
    expect(() => parseShippingMap('{"shippingPaths":["components/**"]}'))
      .toThrow(/must define "shippingPaths" as an object/);
  });

  it('rejects an empty map rather than silently bypassing the gate', () => {
    expect(() => parseShippingMap('{"shippingPaths":{}}')).toThrow(/no "shippingPaths" entries/);
  });

  it('rejects a pattern that does not end in "/**"', () => {
    expect(() => parseShippingMap('{"shippingPaths":{"components":"@scope/p"}}'))
      .toThrow(/must end in "\/\*\*"/);
  });

  it('rejects an owner that is neither a package name nor null', () => {
    expect(() => parseShippingMap('{"shippingPaths":{"components/**":42}}'))
      .toThrow(/must be an npm package name or null/);
  });

  it('rejects malformed JSON', () => {
    expect(() => parseShippingMap('{not json')).toThrow(/not valid JSON/);
  });

  it('accepts null owners', () => {
    expect(parseShippingMap('{"shippingPaths":{"assets/**":null}}')).toEqual({ 'assets/**': null });
  });
});

// ---------------------------------------------------------------------------
// Config integrity — every named owner must be a real, publishable workspace
// package. This is the W030 check applied to the ownership map itself: a typo
// here would make the gate demand a package that can never be declared.
// ---------------------------------------------------------------------------

describe('changeset-paths.json owners are real publishable packages', () => {
  const workspaceGlobs = JSON.parse(
    readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'),
  ).workspaces;

  const publishable = new Set();
  for (const glob of workspaceGlobs) {
    const base = glob.endsWith('/*') ? glob.slice(0, -2) : glob;
    const dirs = glob.endsWith('/*')
      ? readdirSync(join(REPO_ROOT, base), { withFileTypes: true })
          .filter(e => e.isDirectory())
          .map(e => join(base, e.name))
      : [base];
    for (const dir of dirs) {
      const manifest = join(REPO_ROOT, dir, 'package.json');
      if (!existsSync(manifest)) continue;
      const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
      if (!pkg.private && pkg.name) publishable.add(pkg.name);
    }
  }

  it('finds the workspace packages at all (guards the discovery above)', () => {
    expect(publishable.size).toBeGreaterThan(0);
  });

  it('every non-null owner is a published workspace package', () => {
    for (const [pattern, owner] of Object.entries(MAP)) {
      if (owner === null) continue;
      expect([...publishable], `owner of ${pattern}`).toContain(owner);
    }
  });
});
