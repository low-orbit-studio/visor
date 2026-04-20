import { describe, it, expect } from 'vitest';
import { bumpPatch, detectChangedPackages, computeBumps, PACKAGES } from '../auto-version.mjs';

function file(filename) {
  return { filename };
}

describe('bumpPatch', () => {
  it('increments patch', () => expect(bumpPatch('0.4.0')).toBe('0.4.1'));
  it('increments patch past 9', () => expect(bumpPatch('1.2.9')).toBe('1.2.10'));
  it('leaves major and minor unchanged', () => expect(bumpPatch('2.5.3')).toBe('2.5.4'));
});

describe('detectChangedPackages', () => {
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
    const result = detectChangedPackages([file('packages/docs/content/docs/button.mdx')]);
    expect(result).toHaveLength(0);
  });

  it('ignores root-level file changes', () => {
    const result = detectChangedPackages([
      file('components/ui/button/button.tsx'),
      file('.github/workflows/ci.yml'),
      file('docs/roadmap.md'),
    ]);
    expect(result).toHaveLength(0);
  });

  it('returns empty array for no files', () => {
    expect(detectChangedPackages([])).toHaveLength(0);
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
    const bumps = computeBumps({
      prFiles: [file('packages/tokens/src/index.ts')],
      readJson,
    });
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
    const bumps = computeBumps({
      prFiles: [file('docs/roadmap.md')],
      readJson,
    });
    expect(bumps).toHaveLength(0);
  });

  it('does not bump theme-engine when only tokens changed', () => {
    const bumps = computeBumps({
      prFiles: [file('packages/tokens/src/theme.ts')],
      readJson,
    });
    expect(bumps.map(b => b.name)).not.toContain('@loworbitstudio/visor-theme-engine');
  });
});
