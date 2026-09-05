import { describe, it, expect } from 'vitest';
import path from 'node:path';
import {
  ARTIFACTS,
  compareVersions,
  detectDrift,
  formatStatusTable,
  assertVisorWorktree,
  resolveArtifactPath,
  buildStatusReport,
  DEFAULT_STALE_DAYS,
  resolveStaleDays,
  readPendingChangesets,
  oldestChangesetAgeDays,
  fetchPublishAgeDays,
  formatQueueSummary,
} from '../visor-publish-status.mjs';

describe('compareVersions', () => {
  it('returns 0 for equal versions', () => {
    expect(compareVersions('0.6.0', '0.6.0')).toBe(0);
  });

  it('returns -1 when first is older (patch)', () => {
    expect(compareVersions('0.6.0', '0.6.1')).toBe(-1);
  });

  it('returns 1 when first is newer (patch)', () => {
    expect(compareVersions('0.6.1', '0.6.0')).toBe(1);
  });

  it('handles minor differences', () => {
    expect(compareVersions('0.7.0', '0.6.99')).toBe(1);
  });

  it('handles major differences', () => {
    expect(compareVersions('1.0.0', '0.99.99')).toBe(1);
  });

  it('handles double-digit components correctly', () => {
    expect(compareVersions('0.10.0', '0.9.0')).toBe(1);
    expect(compareVersions('0.9.0', '0.10.0')).toBe(-1);
  });

  it('throws on prerelease tags rather than silently comparing as NaN', () => {
    expect(() => compareVersions('0.6.0-beta.1', '0.6.0')).toThrow(/Unsupported version/);
    expect(() => compareVersions('0.6.0', '0.6.0-rc.1')).toThrow(/Unsupported version/);
  });

  it('throws on non-3-part versions', () => {
    expect(() => compareVersions('0.6', '0.6.0')).toThrow(/Unsupported version/);
    expect(() => compareVersions('0.6.0.1', '0.6.0')).toThrow(/Unsupported version/);
  });

  it('throws on non-numeric components', () => {
    expect(() => compareVersions('0.x.0', '0.0.0')).toThrow(/Unsupported version/);
  });
});

describe('detectDrift', () => {
  it('returns "no" when versions match', () => {
    expect(detectDrift('0.6.0', '0.6.0')).toBe('no');
  });

  it('returns "ahead" when main is ahead of registry', () => {
    expect(detectDrift('0.6.0', '0.6.1')).toBe('ahead');
  });

  it('returns "behind" when registry is ahead of main', () => {
    expect(detectDrift('0.6.1', '0.6.0')).toBe('behind');
  });

  it('returns "error" when published is null', () => {
    expect(detectDrift(null, '0.6.0')).toBe('error');
  });

  it('returns "error" when onMain is null', () => {
    expect(detectDrift('0.6.0', null)).toBe('error');
  });

  it('returns "error" when version shape is unsupported (e.g. prerelease)', () => {
    expect(detectDrift('0.6.0-beta.1', '0.6.0')).toBe('error');
  });
});

describe('formatStatusTable', () => {
  it('produces a table with the expected header columns', () => {
    const out = formatStatusTable([
      ['@loworbitstudio/visor-core', '0.6.0', '0.6.0', 'no'],
    ]);
    const headerLine = out.split('\n')[0];
    expect(headerLine).toMatch(/Artifact/);
    expect(headerLine).toMatch(/Published/);
    expect(headerLine).toMatch(/On main/);
    expect(headerLine).toMatch(/Drift/);
  });

  it('aligns columns so the header is at least as wide as the widest value', () => {
    const out = formatStatusTable([
      ['@low-orbit-studio/visor-themes-private', '0.1.4', '0.1.4', 'no'],
    ]);
    const lines = out.split('\n');
    const headerArtifactCol = lines[0].indexOf('Published');
    const rowArtifactCol = lines[1].indexOf('0.1.4');
    expect(headerArtifactCol).toBeGreaterThan(0);
    expect(rowArtifactCol).toBeGreaterThanOrEqual(headerArtifactCol);
  });

  it('renders all 4 artifacts as rows when given 4 inputs', () => {
    const rows = ARTIFACTS.map(a => [a.name, '0.0.0', '0.0.0', 'no']);
    const out = formatStatusTable(rows);
    expect(out.split('\n')).toHaveLength(5);
  });
});

describe('assertVisorWorktree', () => {
  it('passes when packages/tokens/package.json names the visor-core package', () => {
    const readJson = p => {
      if (p.endsWith('packages/tokens/package.json')) {
        return { name: '@loworbitstudio/visor-core' };
      }
      throw new Error(`unexpected read: ${p}`);
    };
    expect(() => assertVisorWorktree('/fake/visor-root', readJson)).not.toThrow();
  });

  it('throws a clear error when the file is missing', () => {
    const readJsonThatThrows = () => {
      throw new Error('ENOENT: no such file');
    };
    expect(() =>
      assertVisorWorktree('/tmp/does-not-exist-' + Date.now(), readJsonThatThrows)
    ).toThrow(/Not a Visor checkout/);
  });

  it('throws when the file exists but names a different package', () => {
    const readJson = () => ({ name: '@some-other/package' });
    expect(() => assertVisorWorktree('/repo', readJson)).toThrow(/not @loworbitstudio\/visor-core/);
  });
});

describe('resolveArtifactPath', () => {
  it('joins cwd with relPath for local artifacts', () => {
    const artifact = ARTIFACTS.find(a => a.name === '@loworbitstudio/visor-core');
    expect(resolveArtifactPath(artifact, '/repo')).toBe('/repo/packages/tokens/package.json');
  });

  it('uses env override when present for external artifacts', () => {
    const artifact = ARTIFACTS.find(a => a.name === '@low-orbit-studio/visor-themes-private');
    const got = resolveArtifactPath(artifact, '/repo', {
      VISOR_THEMES_PRIVATE_PATH: '/custom/themes',
    });
    expect(got).toBe('/custom/themes/package.json');
  });

  it('falls back to defaultDir when env override is absent', () => {
    const artifact = ARTIFACTS.find(a => a.name === '@low-orbit-studio/visor-themes-private');
    const got = resolveArtifactPath(artifact, '/repo', {});
    expect(got).toBe(path.join(artifact.defaultDir, 'package.json'));
  });
});

describe('buildStatusReport', () => {
  it('flags drift when main is ahead of published', () => {
    const versions = {
      '/repo/packages/tokens/package.json': { name: '@loworbitstudio/visor-core', version: '0.7.0' },
      '/repo/packages/cli/package.json': { name: '@loworbitstudio/visor', version: '0.7.0' },
      '/repo/packages/theme-engine/package.json': { name: '@loworbitstudio/visor-theme-engine', version: '0.4.1' },
    };
    const themesPath = path.join(
      ARTIFACTS.find(a => a.name === '@low-orbit-studio/visor-themes-private').defaultDir,
      'package.json'
    );
    versions[themesPath] = { name: '@low-orbit-studio/visor-themes-private', version: '0.1.4' };

    const readJson = p => {
      if (versions[p]) return versions[p];
      throw new Error(`ENOENT: ${p}`);
    };
    const runCommand = (cmd, args) => {
      // Pretend visor-core is published behind main
      if (args.includes('@loworbitstudio/visor-core')) {
        return { status: 0, stdout: '0.6.0\n', stderr: '' };
      }
      if (args.includes('@loworbitstudio/visor')) {
        return { status: 0, stdout: '0.7.0\n', stderr: '' };
      }
      if (args.includes('@loworbitstudio/visor-theme-engine')) {
        return { status: 0, stdout: '0.4.1\n', stderr: '' };
      }
      if (args.includes('@low-orbit-studio/visor-themes-private')) {
        return { status: 0, stdout: '0.1.4\n', stderr: '' };
      }
      return { status: 1, stdout: '', stderr: '' };
    };

    // Need to bypass assertVisorWorktree which uses existsSync; provide a custom cwd
    // and mock-friendly readJson. assertVisorWorktree checks existsSync first, so we
    // need a real path. Use the actual repo root for that single check.
    const actualCwd = path.resolve(import.meta.dirname || path.dirname(new URL(import.meta.url).pathname), '../..');
    const readJsonReal = p => {
      if (p === path.join(actualCwd, 'packages/tokens/package.json')) {
        return { name: '@loworbitstudio/visor-core', version: '0.7.0' };
      }
      if (p === path.join(actualCwd, 'packages/cli/package.json')) {
        return { name: '@loworbitstudio/visor', version: '0.7.0' };
      }
      if (p === path.join(actualCwd, 'packages/theme-engine/package.json')) {
        return { name: '@loworbitstudio/visor-theme-engine', version: '0.4.1' };
      }
      // themes-private — let real existsSync decide; if missing, that's fine for this test
      throw new Error(`ENOENT: ${p}`);
    };

    const report = buildStatusReport({
      cwd: actualCwd,
      env: { VISOR_THEMES_PRIVATE_PATH: '/nonexistent-themes-' + Date.now() },
      readJson: readJsonReal,
      runCommand,
    });
    // visor-core row should show drift = ahead (main 0.7.0 > published 0.6.0)
    const visorCoreRow = report.rows.find(r => r[0] === '@loworbitstudio/visor-core');
    expect(visorCoreRow[3]).toBe('ahead');
    expect(report.driftFound).toBe(true);
  });

  it('reports no drift when versions match', () => {
    const actualCwd = path.resolve(import.meta.dirname || path.dirname(new URL(import.meta.url).pathname), '../..');
    const readJsonReal = p => {
      if (p === path.join(actualCwd, 'packages/tokens/package.json')) {
        return { name: '@loworbitstudio/visor-core', version: '0.6.0' };
      }
      if (p === path.join(actualCwd, 'packages/cli/package.json')) {
        return { name: '@loworbitstudio/visor', version: '0.7.0' };
      }
      if (p === path.join(actualCwd, 'packages/theme-engine/package.json')) {
        return { name: '@loworbitstudio/visor-theme-engine', version: '0.4.1' };
      }
      throw new Error(`ENOENT: ${p}`);
    };
    const runCommand = (cmd, args) => {
      if (args.includes('@loworbitstudio/visor-core')) return { status: 0, stdout: '0.6.0\n', stderr: '' };
      if (args.includes('@loworbitstudio/visor')) return { status: 0, stdout: '0.7.0\n', stderr: '' };
      if (args.includes('@loworbitstudio/visor-theme-engine')) return { status: 0, stdout: '0.4.1\n', stderr: '' };
      // themes-private path is missing in this test, so npm view will run but
      // local existsSync gates it out anyway. Stub a successful response so
      // the warn-on-failure path doesn't pollute test output.
      if (args.includes('@low-orbit-studio/visor-themes-private')) {
        return { status: 0, stdout: '0.1.4\n', stderr: '' };
      }
      return { status: 1, stdout: '', stderr: '' };
    };
    const report = buildStatusReport({
      cwd: actualCwd,
      env: { VISOR_THEMES_PRIVATE_PATH: '/nonexistent-themes-' + Date.now() },
      readJson: readJsonReal,
      runCommand,
    });
    const inSyncRows = report.rows.filter(r => r[3] === 'no');
    expect(inSyncRows.length).toBeGreaterThanOrEqual(3);
  });

  it('classifies the private artifact as auth? (not error) when GITHUB_PACKAGES_TOKEN is absent', () => {
    const actualCwd = path.resolve(
      import.meta.dirname || path.dirname(new URL(import.meta.url).pathname),
      '../..'
    );
    const readJsonReal = p => {
      if (p === path.join(actualCwd, 'packages/tokens/package.json')) {
        return { name: '@loworbitstudio/visor-core', version: '0.12.0' };
      }
      if (p === path.join(actualCwd, 'packages/cli/package.json')) {
        return { name: '@loworbitstudio/visor', version: '1.6.0' };
      }
      if (p === path.join(actualCwd, 'packages/theme-engine/package.json')) {
        return { name: '@loworbitstudio/visor-theme-engine', version: '0.16.0' };
      }
      throw new Error(`ENOENT: ${p}`);
    };
    const runCommand = (cmd, args) => {
      if (args.includes('@loworbitstudio/visor-core')) return { status: 0, stdout: '0.12.0\n', stderr: '' };
      if (args.includes('@loworbitstudio/visor')) return { status: 0, stdout: '1.6.0\n', stderr: '' };
      if (args.includes('@loworbitstudio/visor-theme-engine')) return { status: 0, stdout: '0.16.0\n', stderr: '' };
      // Private package: npm rejects with 401 because no token reached the registry.
      if (args.includes('@low-orbit-studio/visor-themes-private')) {
        return {
          status: 1,
          stdout: '',
          stderr: 'npm error code E401\nnpm error 401 Unauthorized - GET https://npm.pkg.github.com/...',
        };
      }
      return { status: 1, stdout: '', stderr: '' };
    };
    const report = buildStatusReport({
      cwd: actualCwd,
      // No GITHUB_PACKAGES_TOKEN — mirrors a bare run outside `varlock run`.
      env: { VISOR_THEMES_PRIVATE_PATH: '/nonexistent-themes-' + Date.now() },
      readJson: readJsonReal,
      runCommand,
    });
    const themesRow = report.rows.find(r => r[0] === '@low-orbit-studio/visor-themes-private');
    expect(themesRow[3]).toBe('auth?');
    expect(report.authMissing).toBe(true);
    // The missing credential must NOT masquerade as real drift/error.
    expect(report.errorFound).toBe(false);
    expect(report.driftFound).toBe(false);
  });

  it('classifies an npm 401 as auth? even when the token env var is set (expired token)', () => {
    const actualCwd = path.resolve(
      import.meta.dirname || path.dirname(new URL(import.meta.url).pathname),
      '../..'
    );
    const readJsonReal = p => {
      if (p === path.join(actualCwd, 'packages/tokens/package.json')) {
        return { name: '@loworbitstudio/visor-core', version: '0.12.0' };
      }
      if (p === path.join(actualCwd, 'packages/cli/package.json')) {
        return { name: '@loworbitstudio/visor', version: '1.6.0' };
      }
      if (p === path.join(actualCwd, 'packages/theme-engine/package.json')) {
        return { name: '@loworbitstudio/visor-theme-engine', version: '0.16.0' };
      }
      throw new Error(`ENOENT: ${p}`);
    };
    const runCommand = (cmd, args) => {
      if (args.includes('@loworbitstudio/visor-core')) return { status: 0, stdout: '0.12.0\n', stderr: '' };
      if (args.includes('@loworbitstudio/visor')) return { status: 0, stdout: '1.6.0\n', stderr: '' };
      if (args.includes('@loworbitstudio/visor-theme-engine')) return { status: 0, stdout: '0.16.0\n', stderr: '' };
      if (args.includes('@low-orbit-studio/visor-themes-private')) {
        return { status: 1, stdout: '', stderr: 'npm error code E401\nnpm error 401 Unauthorized' };
      }
      return { status: 1, stdout: '', stderr: '' };
    };
    const report = buildStatusReport({
      cwd: actualCwd,
      env: {
        VISOR_THEMES_PRIVATE_PATH: '/nonexistent-themes-' + Date.now(),
        GITHUB_PACKAGES_TOKEN: 'present-but-expired',
      },
      readJson: readJsonReal,
      runCommand,
    });
    const themesRow = report.rows.find(r => r[0] === '@low-orbit-studio/visor-themes-private');
    expect(themesRow[3]).toBe('auth?');
    expect(report.authMissing).toBe(true);
    expect(report.errorFound).toBe(false);
  });
});

// --- VI-633: queued changesets + publish-path staleness ---------------------

describe('resolveStaleDays', () => {
  it('defaults to DEFAULT_STALE_DAYS', () => {
    expect(resolveStaleDays({}, undefined)).toBe(DEFAULT_STALE_DAYS);
  });

  it('reads the env override', () => {
    expect(resolveStaleDays({ VISOR_PUBLISH_STALE_DAYS: '3' }, undefined)).toBe(3);
  });

  it('explicit override beats env', () => {
    expect(resolveStaleDays({ VISOR_PUBLISH_STALE_DAYS: '3' }, '9')).toBe(9);
  });

  it('treats an empty env value as unset', () => {
    expect(resolveStaleDays({ VISOR_PUBLISH_STALE_DAYS: '' }, undefined)).toBe(DEFAULT_STALE_DAYS);
  });

  it('throws on a non-numeric threshold', () => {
    expect(() => resolveStaleDays({}, 'soon')).toThrow(/Invalid stale-days/);
  });

  it('throws on a negative threshold', () => {
    expect(() => resolveStaleDays({}, '-1')).toThrow(/Invalid stale-days/);
  });
});

describe('readPendingChangesets', () => {
  it('counts .md files and excludes README.md', () => {
    const readDir = () => ['README.md', 'quiet-forks-argue.md', 'brave-cows-sing.md'];
    expect(readPendingChangesets('/repo', readDir)).toEqual([
      'brave-cows-sing.md',
      'quiet-forks-argue.md',
    ]);
  });

  it('excludes README.md case-insensitively', () => {
    const readDir = () => ['readme.md', 'a.md'];
    expect(readPendingChangesets('/repo', readDir)).toEqual(['a.md']);
  });

  it('ignores non-markdown entries such as config.json', () => {
    const readDir = () => ['config.json', 'pre.json', 'a.md'];
    expect(readPendingChangesets('/repo', readDir)).toEqual(['a.md']);
  });

  it('returns [] when .changeset does not exist', () => {
    const readDir = () => { throw new Error('ENOENT'); };
    expect(readPendingChangesets('/repo', readDir)).toEqual([]);
  });
});

describe('oldestChangesetAgeDays', () => {
  const now = new Date('2026-09-04T00:00:00Z');

  it('returns the age of the OLDEST changeset, not the newest', () => {
    const runCommand = (_cmd, args) => {
      const rel = args[args.length - 1];
      const dates = {
        '.changeset/old.md': '2026-07-21T00:00:00Z',
        '.changeset/new.md': '2026-09-03T00:00:00Z',
      };
      return { status: 0, stdout: dates[rel] ?? '', stderr: '' };
    };
    expect(oldestChangesetAgeDays('/repo', ['new.md', 'old.md'], runCommand, now)).toBe(45);
  });

  it('uses git commit date, not filesystem mtime', () => {
    // The command issued must be a git log against the changeset path — mtime
    // would report ~0 days in a fresh clone and disarm the gate in CI.
    const calls = [];
    const runCommand = (cmd, args) => {
      calls.push([cmd, ...args]);
      return { status: 0, stdout: '2026-08-01T00:00:00Z', stderr: '' };
    };
    oldestChangesetAgeDays('/repo', ['a.md'], runCommand, now);
    expect(calls[0][0]).toBe('git');
    expect(calls[0]).toContain('log');
    expect(calls[0]).toContain('--format=%cI');
    expect(calls[0][calls[0].length - 1]).toBe('.changeset/a.md');
  });

  it('returns null when no changesets are pending', () => {
    const runCommand = () => ({ status: 0, stdout: '', stderr: '' });
    expect(oldestChangesetAgeDays('/repo', [], runCommand, now)).toBeNull();
  });

  it('skips files whose git date cannot be resolved', () => {
    const runCommand = (_cmd, args) =>
      args[args.length - 1] === '.changeset/tracked.md'
        ? { status: 0, stdout: '2026-08-30T00:00:00Z', stderr: '' }
        : { status: 1, stdout: '', stderr: 'not tracked' };
    expect(
      oldestChangesetAgeDays('/repo', ['untracked.md', 'tracked.md'], runCommand, now)
    ).toBe(5);
  });

  it('returns null when every date is unresolvable', () => {
    const runCommand = () => ({ status: 1, stdout: '', stderr: 'boom' });
    expect(oldestChangesetAgeDays('/repo', ['a.md'], runCommand, now)).toBeNull();
  });
});

describe('fetchPublishAgeDays', () => {
  const now = new Date('2026-09-04T00:00:00Z');

  it('reads the publish time of the given version from the registry time map', () => {
    const runCommand = () => ({
      status: 0,
      stdout: JSON.stringify({
        modified: '2026-07-21T20:11:44.564Z',
        '1.20.0': '2026-07-21T04:33:57.261Z',
        '1.21.0': '2026-07-21T20:11:44.368Z',
      }),
      stderr: '',
    });
    expect(fetchPublishAgeDays('@loworbitstudio/visor', '1.21.0', 'npm', runCommand, now)).toBe(44);
  });

  it('returns null when the version is absent from the time map', () => {
    const runCommand = () => ({ status: 0, stdout: JSON.stringify({ '1.0.0': '2026-01-01T00:00:00Z' }), stderr: '' });
    expect(fetchPublishAgeDays('pkg', '9.9.9', 'npm', runCommand, now)).toBeNull();
  });

  it('returns null when no version is published', () => {
    const runCommand = () => { throw new Error('should not be called'); };
    expect(fetchPublishAgeDays('pkg', null, 'npm', runCommand, now)).toBeNull();
  });

  it('returns null on unparseable registry output', () => {
    const runCommand = () => ({ status: 0, stdout: 'not json', stderr: '' });
    expect(fetchPublishAgeDays('pkg', '1.0.0', 'npm', runCommand, now)).toBeNull();
  });

  it('targets the GitHub Packages registry for private artifacts', () => {
    let seen = null;
    const runCommand = (_cmd, args) => { seen = args; return { status: 0, stdout: '{}', stderr: '' }; };
    fetchPublishAgeDays('pkg', '1.0.0', 'github-packages', runCommand, now);
    expect(seen).toContain('--registry=https://npm.pkg.github.com/');
  });
});

describe('buildStatusReport — queue blind spot (VI-633 regression)', () => {
  // Replays the real 2026-07/09 outage state: every version matches, so the
  // drift table reads entirely clean, while six changesets sit queued and the
  // publish credential is dead. Before VI-633 this returned exit 0.
  const OUTAGE_NOW = new Date('2026-09-04T00:00:00Z');
  const cwd = process.cwd(); // vitest runs from the repo root; existsSync needs a real path

  const inSync = {
    'packages/tokens/package.json': ['@loworbitstudio/visor-core', '0.13.0'],
    'packages/cli/package.json': ['@loworbitstudio/visor', '1.21.0'],
    'packages/theme-engine/package.json': ['@loworbitstudio/visor-theme-engine', '0.17.1'],
  };
  const themesPath = path.join(
    ARTIFACTS.find(a => a.name === '@low-orbit-studio/visor-themes-private').defaultDir,
    'package.json'
  );

  const readJson = p => {
    for (const [rel, [name, version]] of Object.entries(inSync)) {
      if (p === path.join(cwd, rel)) return { name, version };
    }
    if (p === themesPath) return { name: '@low-orbit-studio/visor-themes-private', version: '0.1.4' };
    throw new Error(`ENOENT: ${p}`);
  };

  const published = {
    '@loworbitstudio/visor-core': '0.13.0',
    '@loworbitstudio/visor': '1.21.0',
    '@loworbitstudio/visor-theme-engine': '0.17.1',
    '@low-orbit-studio/visor-themes-private': '0.1.4',
  };

  const makeRunCommand = ({ oldestIso }) => (cmd, args) => {
    if (cmd === 'git') {
      // Every queued changeset landed on the same day in this fixture.
      return { status: 0, stdout: oldestIso, stderr: '' };
    }
    if (args.includes('time')) {
      return { status: 0, stdout: JSON.stringify({ '1.21.0': '2026-07-21T20:11:44.368Z' }), stderr: '' };
    }
    const hit = Object.keys(published).find(n => args.includes(n));
    return hit
      ? { status: 0, stdout: `${published[hit]}\n`, stderr: '' }
      : { status: 1, stdout: '', stderr: '' };
  };

  const sixQueued = () => [
    'README.md',
    'vi-619.md', 'vi-622.md', 'vi-623.md', 'vi-626.md', 'vi-627.md', 'vi-628.md',
  ];

  it('reports no version drift — the table genuinely is clean', () => {
    const report = buildStatusReport({
      cwd, env: {}, readJson,
      runCommand: makeRunCommand({ oldestIso: '2026-07-21T00:00:00Z' }),
      readDir: sixQueued, now: OUTAGE_NOW,
    });
    expect(report.driftFound).toBe(false);
    // Assert only the three in-repo artifacts. buildStatusReport resolves the
    // private themes package through the real `existsSync`, so that row reads
    // `no` on a machine with the sibling repo cloned and `error` on a CI runner
    // without it — an environment difference, not a drift signal, and not what
    // this test is about.
    const inRepo = report.rows.filter(r => r[0] !== '@low-orbit-studio/visor-themes-private');
    expect(inRepo).toHaveLength(3);
    expect(inRepo.every(r => r[3] === 'no')).toBe(true);
  });

  it('still flags the queue as stale — the blind spot is now covered', () => {
    const report = buildStatusReport({
      cwd, env: {}, readJson,
      runCommand: makeRunCommand({ oldestIso: '2026-07-21T00:00:00Z' }),
      readDir: sixQueued, now: OUTAGE_NOW,
    });
    expect(report.queue.pending).toBe(6);
    expect(report.queue.oldestDays).toBe(45);
    expect(report.queue.stale).toBe(true);
  });

  it('reports days since the last successful publish', () => {
    const report = buildStatusReport({
      cwd, env: {}, readJson,
      runCommand: makeRunCommand({ oldestIso: '2026-07-21T00:00:00Z' }),
      readDir: sixQueued, now: OUTAGE_NOW,
    });
    expect(report.lastPublish.version).toBe('1.21.0');
    expect(report.lastPublish.ageDays).toBe(44);
  });

  it('does NOT flag a queue that is merely non-empty (D2 — no permanently-red gate)', () => {
    const report = buildStatusReport({
      cwd, env: {}, readJson,
      // Six changesets, but all landed yesterday — normal mid-development.
      runCommand: makeRunCommand({ oldestIso: '2026-09-03T00:00:00Z' }),
      readDir: sixQueued, now: OUTAGE_NOW,
    });
    expect(report.queue.pending).toBe(6);
    expect(report.queue.stale).toBe(false);
  });

  it('reports an empty queue when only README.md is present', () => {
    const report = buildStatusReport({
      cwd, env: {}, readJson,
      runCommand: makeRunCommand({ oldestIso: '2026-07-21T00:00:00Z' }),
      readDir: () => ['README.md'], now: OUTAGE_NOW,
    });
    expect(report.queue.pending).toBe(0);
    expect(report.queue.stale).toBe(false);
  });

  it('honours a threshold override', () => {
    const report = buildStatusReport({
      cwd, env: {}, readJson,
      runCommand: makeRunCommand({ oldestIso: '2026-07-21T00:00:00Z' }),
      readDir: sixQueued, now: OUTAGE_NOW, staleDays: '90',
    });
    expect(report.queue.stale).toBe(false);
  });

  it('formatQueueSummary renders both lines', () => {
    const out = formatQueueSummary({
      queue: { pending: 6, oldestDays: 45, staleDays: 14, stale: true },
      lastPublish: { name: '@loworbitstudio/visor', version: '1.21.0', ageDays: 44 },
    });
    expect(out).toContain('Pending changesets: 6');
    expect(out).toContain('oldest 45d');
    expect(out).toContain('@loworbitstudio/visor@1.21.0, 44d ago');
  });
});
