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
});
