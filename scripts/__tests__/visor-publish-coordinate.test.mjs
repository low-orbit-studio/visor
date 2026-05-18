import { describe, it, expect } from 'vitest';
import {
  parsePRReference,
  validatePRStates,
  computeBumpPreview,
  formatPreview,
  bumpPatch,
  findRelevantRun,
  fetchPRCIConclusion,
} from '../visor-publish-coordinate.mjs';

describe('parsePRReference', () => {
  it('parses a numeric string', () => {
    expect(parsePRReference('369')).toBe(369);
  });

  it('parses a numeric string with whitespace', () => {
    expect(parsePRReference('  42  ')).toBe(42);
  });

  it('parses a github.com pull URL', () => {
    expect(parsePRReference('https://github.com/low-orbit-studio/visor/pull/369')).toBe(369);
  });

  it('parses a #N suffix', () => {
    expect(parsePRReference('visor#369')).toBe(369);
  });

  it('throws on empty input', () => {
    expect(() => parsePRReference('')).toThrow();
    expect(() => parsePRReference(null)).toThrow();
  });

  it('throws on garbage input', () => {
    expect(() => parsePRReference('not-a-pr-reference')).toThrow(/Could not parse/);
  });
});

describe('validatePRStates', () => {
  const okPR = { number: 1, state: 'closed', merged: true, ciConclusion: 'success' };

  it('returns ok when both PRs are merged with green CI', () => {
    const result = validatePRStates({
      visorPR: { ...okPR, number: 369 },
      themesPR: { ...okPR, number: 2 },
    });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('errors when Visor PR is unmerged', () => {
    const result = validatePRStates({
      visorPR: { number: 369, state: 'open', merged: false, ciConclusion: 'success' },
      themesPR: okPR,
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringMatching(/Visor.*not merged/)]));
  });

  it('errors when themes PR is unmerged', () => {
    const result = validatePRStates({
      visorPR: okPR,
      themesPR: { number: 2, state: 'open', merged: false, ciConclusion: 'success' },
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringMatching(/Themes.*not merged/)]));
  });

  it('errors when Visor CI failed', () => {
    const result = validatePRStates({
      visorPR: { ...okPR, ciConclusion: 'failure' },
      themesPR: okPR,
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringMatching(/Visor.*CI conclusion is "failure"/)]));
  });

  it('errors when themes CI was cancelled', () => {
    const result = validatePRStates({
      visorPR: okPR,
      themesPR: { ...okPR, ciConclusion: 'cancelled' },
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringMatching(/Themes.*CI conclusion is "cancelled"/)]));
  });

  it('reports both errors when both PRs fail validation', () => {
    const result = validatePRStates({
      visorPR: { number: 1, state: 'open', merged: false, ciConclusion: 'success' },
      themesPR: { number: 2, state: 'closed', merged: true, ciConclusion: 'failure' },
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it('errors when a PR object is missing entirely', () => {
    const result = validatePRStates({ visorPR: null, themesPR: okPR });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/Visor.*missing/);
  });

  it('errors when CI conclusion is null (could not be determined)', () => {
    const result = validatePRStates({
      visorPR: { ...okPR, ciConclusion: null },
      themesPR: okPR,
    });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/Visor.*CI conclusion could not be determined/);
  });

  it('errors when CI conclusion is undefined (could not be determined)', () => {
    const okNoCi = { number: 1, state: 'closed', merged: true };
    const result = validatePRStates({ visorPR: okNoCi, themesPR: okPR });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/Visor.*CI conclusion could not be determined/);
  });

  it('passes when CI conclusion is "no-checks" (repo has no check-runs)', () => {
    const result = validatePRStates({
      visorPR: { ...okPR, ciConclusion: 'no-checks' },
      themesPR: { ...okPR, ciConclusion: 'no-checks' },
    });
    expect(result.ok).toBe(true);
  });
});

describe('fetchPRCIConclusion', () => {
  it('returns "no-checks" when the API responds with an empty array', () => {
    const runCommand = () => ({ status: 0, stdout: '[]', stderr: '' });
    expect(fetchPRCIConclusion('repo', 'sha123', runCommand)).toBe('no-checks');
  });

  it('returns null when the gh API call fails (could-not-determine)', () => {
    const runCommand = () => ({ status: 1, stdout: '', stderr: 'auth' });
    expect(fetchPRCIConclusion('repo', 'sha123', runCommand)).toBe(null);
  });

  it('returns null when the JSON is unparseable', () => {
    const runCommand = () => ({ status: 0, stdout: 'not json', stderr: '' });
    expect(fetchPRCIConclusion('repo', 'sha123', runCommand)).toBe(null);
  });

  it('returns "success" when all conclusions are success', () => {
    const runCommand = () => ({ status: 0, stdout: '["success"]', stderr: '' });
    expect(fetchPRCIConclusion('repo', 'sha123', runCommand)).toBe('success');
  });

  it('returns the failing conclusion when present', () => {
    const runCommand = () => ({ status: 0, stdout: '["success","failure"]', stderr: '' });
    expect(fetchPRCIConclusion('repo', 'sha123', runCommand)).toBe('failure');
  });
});

describe('findRelevantRun', () => {
  it('prefers an exact SHA match', () => {
    const runs = [
      { databaseId: 1, headSha: 'aaa', createdAt: '2026-05-08T12:00:00Z' },
      { databaseId: 2, headSha: 'bbb', createdAt: '2026-05-08T11:00:00Z' },
    ];
    const match = findRelevantRun(runs, 'bbb', '2026-05-08T10:00:00Z');
    expect(match.databaseId).toBe(2);
  });

  it('falls back to newest run created at or after the merge time', () => {
    const runs = [
      { databaseId: 1, headSha: 'xxx', createdAt: '2026-05-08T12:30:00Z' },
      { databaseId: 2, headSha: 'yyy', createdAt: '2026-05-08T12:00:00Z' },
      { databaseId: 3, headSha: 'zzz', createdAt: '2026-05-08T09:00:00Z' },
    ];
    // Merged at 11:30 — only runs 1 and 2 qualify; newest is 1.
    const match = findRelevantRun(runs, 'no-such-sha', '2026-05-08T11:30:00Z');
    expect(match.databaseId).toBe(1);
  });

  it('returns null when no SHA match and no run after merge time', () => {
    const runs = [
      { databaseId: 1, headSha: 'aaa', createdAt: '2026-05-08T09:00:00Z' },
    ];
    const match = findRelevantRun(runs, 'no-match', '2026-05-08T10:00:00Z');
    expect(match).toBe(null);
  });

  it('returns null when no SHA match and no merge time provided', () => {
    const runs = [
      { databaseId: 1, headSha: 'aaa', createdAt: '2026-05-08T12:00:00Z' },
    ];
    const match = findRelevantRun(runs, 'no-match', null);
    expect(match).toBe(null);
  });
});

describe('bumpPatch', () => {
  it('increments the patch component', () => {
    expect(bumpPatch('0.1.4')).toBe('0.1.5');
    expect(bumpPatch('0.1.9')).toBe('0.1.10');
    expect(bumpPatch('1.2.3')).toBe('1.2.4');
  });
});

describe('computeBumpPreview', () => {
  const readJson = path => {
    // For tests: only the themes-private path may be read; return a fixed version.
    if (path.endsWith('package.json')) return { version: '0.1.4' };
    throw new Error(`unexpected read: ${path}`);
  };

  it('uses changeset releases when present (minor bump)', () => {
    const preview = computeBumpPreview({
      visorPRFiles: [{ filename: 'packages/cli/src/index.ts' }],
      themesPRFiles: [],
      changesetReleases: [
        { name: '@loworbitstudio/visor', oldVersion: '0.7.0', newVersion: '0.8.0', type: 'minor' },
      ],
      readJson,
    });
    expect(preview.visor.source).toBe('changeset');
    expect(preview.visor.packages).toEqual([
      expect.objectContaining({ name: '@loworbitstudio/visor', from: '0.7.0', to: '0.8.0', type: 'minor' }),
    ]);
  });

  it('returns empty Visor packages when no changesets are present', () => {
    // VI-419: auto-version was deleted, so a shipping-package PR with no
    // changeset produces no Visor-side bump in the coordinated-release preview.
    // The changeset-gate workflow blocks the PR from merging in that state,
    // so a real coordinated release never reaches this code path with empty
    // changesets unless the operator intends a no-Visor-bump preview.
    const preview = computeBumpPreview({
      visorPRFiles: [{ filename: 'packages/tokens/src/index.ts' }],
      themesPRFiles: [],
      changesetReleases: [],
      readJson,
    });
    expect(preview.visor.source).toBe('changeset');
    expect(preview.visor.packages).toEqual([]);
    expect(preview.visor.detail).toMatch(/no pending changesets/);
  });

  it('produces a themes patch bump when published surface is touched', () => {
    const preview = computeBumpPreview({
      visorPRFiles: [],
      themesPRFiles: [{ filename: 'themes/animal/animal.visor.yaml' }],
      changesetReleases: [],
      readJson,
    });
    expect(preview.themes.packages).toEqual([
      expect.objectContaining({
        name: '@low-orbit-studio/visor-themes-private',
        from: '0.1.4',
        to: '0.1.5',
        type: 'patch',
      }),
    ]);
  });

  it('skips themes when only ignored files were touched', () => {
    const preview = computeBumpPreview({
      visorPRFiles: [],
      themesPRFiles: [{ filename: 'README.md' }, { filename: 'docs/something.md' }],
      changesetReleases: [],
      readJson,
    });
    expect(preview.themes.packages).toEqual([]);
    expect(preview.themes.detail).toMatch(/no published surface/);
  });

  it('skips themes when author bumped package.json themselves', () => {
    const preview = computeBumpPreview({
      visorPRFiles: [],
      themesPRFiles: [
        { filename: 'themes/animal/animal.visor.yaml' },
        { filename: 'package.json' },
      ],
      changesetReleases: [],
      readJson,
    });
    expect(preview.themes.packages).toEqual([]);
    expect(preview.themes.detail).toMatch(/already bumped/);
  });
});

describe('formatPreview', () => {
  it('renders both sides with bumps', () => {
    const out = formatPreview({
      visor: {
        source: 'changeset',
        packages: [{ name: '@loworbitstudio/visor', from: '0.7.0', to: '0.8.0', type: 'minor' }],
        detail: '1 changeset pending',
      },
      themes: {
        source: 'auto-patch',
        packages: [
          { name: '@low-orbit-studio/visor-themes-private', from: '0.1.4', to: '0.1.5', type: 'patch' },
        ],
        detail: 'auto-version patch bump',
      },
    });
    expect(out).toMatch(/Coordinated release preview/);
    expect(out).toMatch(/@loworbitstudio\/visor: 0\.7\.0 → 0\.8\.0 \(minor\)/);
    expect(out).toMatch(/@low-orbit-studio\/visor-themes-private: 0\.1\.4 → 0\.1\.5 \(patch\)/);
  });

  it('renders no-bump notes when packages array is empty', () => {
    const out = formatPreview({
      visor: { source: 'changeset', packages: [], detail: 'no pending changesets — add one via `npx changeset add`' },
      themes: { source: 'auto-patch', packages: [], detail: 'no published surface touched' },
    });
    expect(out).toMatch(/no pending changesets/);
    expect(out).toMatch(/no published surface touched/);
  });
});
