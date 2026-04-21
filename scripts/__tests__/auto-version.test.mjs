import { describe, it, expect } from 'vitest';
import {
  bumpPatch,
  detectChangedPackages,
  computeBumps,
  applyBumpsToLockFile,
  PACKAGES,
} from '../auto-version.mjs';

function file(filename) {
  return { filename };
}

describe('bumpPatch', () => {
  it('increments patch', () => expect(bumpPatch('0.4.0')).toBe('0.4.1'));
  it('increments patch past 9', () => expect(bumpPatch('1.2.9')).toBe('1.2.10'));
  it('leaves major and minor unchanged', () => expect(bumpPatch('2.5.3')).toBe('2.5.4'));
});

describe('detectChangedPackages — package detection', () => {
  it('detects tokens change', () => {
    const result = detectChangedPackages([file('packages/tokens/src/index.ts')]);
    expect(result.map(p => p.name)).toEqual(['@loworbitstudio/visor-core']);
  });

  it('detects cli change', () => {
    const result = detectChangedPackages([file('packages/cli/src/commands/add.ts')]);
    expect(result.map(p => p.name)).toEqual(['@loworbitstudio/visor']);
  });

  it('detects theme-engine change', () => {
    const result = detectChangedPackages([file('packages/theme-engine/src/index.ts')]);
    expect(result.map(p => p.name)).toEqual(['@loworbitstudio/visor-theme-engine']);
  });

  it('detects multiple packages changed', () => {
    const result = detectChangedPackages([
      file('packages/tokens/src/index.ts'),
      file('packages/theme-engine/src/shades.ts'),
    ]);
    expect(result.map(p => p.name)).toEqual([
      '@loworbitstudio/visor-core',
      '@loworbitstudio/visor-theme-engine',
    ]);
  });

  it('ignores docs package changes', () => {
    expect(detectChangedPackages([file('packages/docs/content/docs/button.mdx')])).toHaveLength(0);
  });

  it('ignores root-level file changes', () => {
    expect(
      detectChangedPackages([
        file('components/ui/button/button.tsx'),
        file('.github/workflows/ci.yml'),
        file('docs/roadmap.md'),
      ]),
    ).toHaveLength(0);
  });

  it('returns empty array for no files', () => {
    expect(detectChangedPackages([])).toHaveLength(0);
  });
});

describe('detectChangedPackages — manual version bump skipping', () => {
  it('skips tokens when PR changed packages/tokens/package.json (manual minor/major)', () => {
    const result = detectChangedPackages([
      file('packages/tokens/src/index.ts'),
      file('packages/tokens/package.json'),
    ]);
    expect(result.map(p => p.name)).not.toContain('@loworbitstudio/visor-core');
  });

  it('skips cli when PR changed packages/cli/package.json (dep update)', () => {
    const result = detectChangedPackages([
      file('packages/cli/src/commands/add.ts'),
      file('packages/cli/package.json'),
    ]);
    expect(result.map(p => p.name)).not.toContain('@loworbitstudio/visor');
  });

  it('still bumps other packages when only one has a manual version change', () => {
    const result = detectChangedPackages([
      file('packages/tokens/src/index.ts'),
      file('packages/tokens/package.json'), // manual bump — skip tokens
      file('packages/theme-engine/src/shades.ts'), // no package.json change — auto-bump
    ]);
    expect(result.map(p => p.name)).toEqual(['@loworbitstudio/visor-theme-engine']);
  });

  it('skips all packages if all have manual version bumps', () => {
    const result = detectChangedPackages([
      file('packages/tokens/src/index.ts'),
      file('packages/tokens/package.json'),
      file('packages/cli/src/add.ts'),
      file('packages/cli/package.json'),
    ]);
    expect(result).toHaveLength(0);
  });

  it('does NOT skip when only non-package.json files changed', () => {
    const result = detectChangedPackages([file('packages/tokens/src/index.ts')]);
    expect(result.map(p => p.name)).toContain('@loworbitstudio/visor-core');
  });
});

describe('computeBumps', () => {
  const readJson = path => {
    const versions = {
      'packages/tokens/package.json': { version: '0.4.0' },
      'packages/cli/package.json': { version: '0.4.0' },
      'packages/theme-engine/package.json': { version: '0.4.0' },
    };
    return versions[path];
  };

  it('produces a bump entry for each changed package', () => {
    const bumps = computeBumps({ prFiles: [file('packages/tokens/src/index.ts')], readJson });
    expect(bumps).toHaveLength(1);
    expect(bumps[0]).toMatchObject({
      name: '@loworbitstudio/visor-core',
      oldVersion: '0.4.0',
      newVersion: '0.4.1',
    });
  });

  it('bumps multiple packages independently', () => {
    const bumps = computeBumps({
      prFiles: [
        file('packages/tokens/src/index.ts'),
        file('packages/cli/src/commands/add.ts'),
      ],
      readJson,
    });
    expect(bumps).toHaveLength(2);
    expect(bumps.map(b => b.name)).toEqual([
      '@loworbitstudio/visor-core',
      '@loworbitstudio/visor',
    ]);
  });

  it('returns empty array when no packages changed', () => {
    const bumps = computeBumps({ prFiles: [file('docs/roadmap.md')], readJson });
    expect(bumps).toHaveLength(0);
  });

  it('skips package where PR already changed package.json', () => {
    const bumps = computeBumps({
      prFiles: [
        file('packages/tokens/src/index.ts'),
        file('packages/tokens/package.json'),
      ],
      readJson,
    });
    expect(bumps).toHaveLength(0);
  });

  it('does not bump theme-engine when only tokens changed', () => {
    const bumps = computeBumps({ prFiles: [file('packages/tokens/src/theme.ts')], readJson });
    expect(bumps.map(b => b.name)).not.toContain('@loworbitstudio/visor-theme-engine');
  });
});

describe('applyBumpsToLockFile', () => {
  const makeLockFile = () => ({
    lockfileVersion: 3,
    packages: {
      '': { version: '0.4.0' },
      'packages/tokens': { name: '@loworbitstudio/visor-core', version: '0.4.0' },
      'packages/cli': { name: '@loworbitstudio/visor', version: '0.4.0' },
      'packages/theme-engine': { name: '@loworbitstudio/visor-theme-engine', version: '0.4.0' },
    },
  });

  it('updates the version for a bumped package', () => {
    const lock = applyBumpsToLockFile(makeLockFile(), [
      { dir: 'packages/tokens', newVersion: '0.4.1' },
    ]);
    expect(lock.packages['packages/tokens'].version).toBe('0.4.1');
  });

  it('leaves untouched packages unchanged', () => {
    const lock = applyBumpsToLockFile(makeLockFile(), [
      { dir: 'packages/tokens', newVersion: '0.4.1' },
    ]);
    expect(lock.packages['packages/cli'].version).toBe('0.4.0');
    expect(lock.packages['packages/theme-engine'].version).toBe('0.4.0');
  });

  it('handles multiple simultaneous bumps', () => {
    const lock = applyBumpsToLockFile(makeLockFile(), [
      { dir: 'packages/tokens', newVersion: '0.4.1' },
      { dir: 'packages/cli', newVersion: '0.4.1' },
    ]);
    expect(lock.packages['packages/tokens'].version).toBe('0.4.1');
    expect(lock.packages['packages/cli'].version).toBe('0.4.1');
    expect(lock.packages['packages/theme-engine'].version).toBe('0.4.0');
  });

  it('ignores a dir that is not in the lock file', () => {
    const lock = applyBumpsToLockFile(makeLockFile(), [
      { dir: 'packages/nonexistent', newVersion: '1.0.0' },
    ]);
    expect(lock.packages['packages/tokens'].version).toBe('0.4.0');
  });

  it('does not mutate the lock file root entry', () => {
    const lock = applyBumpsToLockFile(makeLockFile(), [
      { dir: 'packages/tokens', newVersion: '0.4.1' },
    ]);
    expect(lock.packages[''].version).toBe('0.4.0');
  });
});
