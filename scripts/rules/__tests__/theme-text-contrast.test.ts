import { describe, it, expect } from 'vitest';
import { themeTextContrast, checkThemeContrast } from '../theme-text-contrast.js';

// ---------------------------------------------------------------------------
// Unit tests for checkThemeContrast (no disk I/O — in-memory theme objects)
// ---------------------------------------------------------------------------

describe('theme-text-contrast rule', () => {
  it('has correct metadata', () => {
    expect(themeTextContrast.name).toBe('theme-text-contrast');
    expect(themeTextContrast.category).toBe('tokens');
    expect(themeTextContrast.warnOnly).toBeUndefined(); // failures block CI
    expect(themeTextContrast.description).toContain('4.5:1');
    expect(themeTextContrast.description).toContain('text-disabled');
  });

  describe('passing theme — text-tertiary alpha 0.55 on black (~6.16:1)', () => {
    const passingTheme = {
      name: 'passing-test',
      colors: { background: '#000000' },
      'colors-dark': { background: '#000000' },
      overrides: {
        dark: {
          'text-primary': 'rgba(255, 255, 255, 0.87)',
          'text-secondary': 'rgba(255, 255, 255, 0.70)',
          'text-tertiary': 'rgba(255, 255, 255, 0.55)',
        },
      },
    };

    it('returns no failures', () => {
      const results = checkThemeContrast({ theme: passingTheme, filename: 'passing-test.visor.yaml' });
      const failures = results.filter((r) => !r.pass);
      expect(failures).toHaveLength(0);
    });

    it('text-tertiary at alpha 0.55 on black passes AA (>= 4.5:1)', () => {
      const results = checkThemeContrast({ theme: passingTheme, filename: 'passing-test.visor.yaml' });
      const tertiary = results.find((r) => r.message.includes('text-tertiary'));
      expect(tertiary).toBeDefined();
      expect(tertiary?.pass).toBe(true);
      // ratio should be >= 4.5
      const ratioMatch = tertiary?.message.match(/([\d.]+):1/);
      expect(ratioMatch).not.toBeNull();
      if (ratioMatch) {
        expect(parseFloat(ratioMatch[1])).toBeGreaterThanOrEqual(4.5);
      }
    });
  });

  describe('failing theme — text-tertiary alpha 0.20 on black (~1.17:1)', () => {
    const failingTheme = {
      name: 'failing-test',
      colors: { background: '#000000' },
      'colors-dark': { background: '#000000' },
      overrides: {
        dark: {
          'text-primary': 'rgba(255, 255, 255, 0.87)',
          'text-secondary': 'rgba(255, 255, 255, 0.70)',
          'text-tertiary': 'rgba(255, 255, 255, 0.20)',
        },
      },
    };

    it('returns exactly one failure for text-tertiary', () => {
      const results = checkThemeContrast({ theme: failingTheme, filename: 'failing-test.visor.yaml' });
      const failures = results.filter((r) => !r.pass);
      expect(failures).toHaveLength(1);
      expect(failures[0].message).toContain('text-tertiary');
    });

    it('failure message contains token, background, ratio, and requirement', () => {
      const results = checkThemeContrast({ theme: failingTheme, filename: 'failing-test.visor.yaml' });
      const failure = results.find((r) => !r.pass);
      expect(failure).toBeDefined();
      expect(failure?.message).toMatch(/failing-test\.visor\.yaml/);
      expect(failure?.message).toMatch(/text-tertiary/);
      expect(failure?.message).toMatch(/#000000/);
      expect(failure?.message).toMatch(/requires 4\.5:1 for AA normal text/);
    });

    it('failure message ratio is < 4.5', () => {
      const results = checkThemeContrast({ theme: failingTheme, filename: 'failing-test.visor.yaml' });
      const failure = results.find((r) => !r.pass);
      const ratioMatch = failure?.message.match(/([\d.]+):1 \(requires/);
      expect(ratioMatch).not.toBeNull();
      if (ratioMatch) {
        expect(parseFloat(ratioMatch[1])).toBeLessThan(4.5);
      }
    });

    it('file property on result matches filename', () => {
      const results = checkThemeContrast({ theme: failingTheme, filename: 'failing-test.visor.yaml' });
      const failure = results.find((r) => !r.pass);
      expect(failure?.file).toBe('failing-test.visor.yaml');
    });
  });

  describe('text-disabled exemption', () => {
    const themeWithDisabled = {
      name: 'disabled-test',
      colors: { background: '#000000' },
      'colors-dark': { background: '#000000' },
      overrides: {
        dark: {
          'text-primary': 'rgba(255, 255, 255, 0.87)',
          'text-secondary': 'rgba(255, 255, 255, 0.70)',
          'text-tertiary': 'rgba(255, 255, 255, 0.55)',
          // text-disabled at 0.10 would fail at ~1.02:1 if checked
          'text-disabled': 'rgba(255, 255, 255, 0.10)',
        },
      },
    };

    it('does not emit any result for text-disabled', () => {
      const results = checkThemeContrast({ theme: themeWithDisabled, filename: 'disabled-test.visor.yaml' });
      const disabledResults = results.filter((r) => r.message.includes('text-disabled'));
      expect(disabledResults).toHaveLength(0);
    });

    it('all non-disabled tokens still pass', () => {
      const results = checkThemeContrast({ theme: themeWithDisabled, filename: 'disabled-test.visor.yaml' });
      const failures = results.filter((r) => !r.pass);
      expect(failures).toHaveLength(0);
    });
  });

  describe('text-ghost exemption', () => {
    const themeWithGhost = {
      name: 'ghost-test',
      colors: { background: '#000000' },
      'colors-dark': { background: '#000000' },
      overrides: {
        dark: {
          'text-primary': 'rgba(255, 255, 255, 0.87)',
          // text-ghost at 0.05 would fail hard if checked
          'text-ghost': 'rgba(255, 255, 255, 0.05)',
        },
      },
    };

    it('does not emit any result for text-ghost', () => {
      const results = checkThemeContrast({ theme: themeWithGhost, filename: 'ghost-test.visor.yaml' });
      const ghostResults = results.filter((r) => r.message.includes('text-ghost'));
      expect(ghostResults).toHaveLength(0);
    });
  });

  describe('hex color text values', () => {
    const hexTheme = {
      name: 'hex-test',
      colors: { background: '#ffffff' },
      overrides: {
        light: {
          'text-primary': '#18181b',
          'text-secondary': '#52525b',
          'text-tertiary': '#a1a1aa',
        },
      },
    };

    it('handles hex color values for text tokens', () => {
      const results = checkThemeContrast({ theme: hexTheme, filename: 'hex-test.visor.yaml' });
      expect(results.length).toBeGreaterThan(0);
    });

    it('text-primary #18181b on #ffffff passes AA', () => {
      const results = checkThemeContrast({ theme: hexTheme, filename: 'hex-test.visor.yaml' });
      const primary = results.find((r) => r.message.includes('text-primary'));
      expect(primary?.pass).toBe(true);
    });
  });

  describe('background resolution', () => {
    it('uses overrides surface-page when present', () => {
      const theme = {
        name: 'surface-page-test',
        colors: { background: '#ffffff' }, // would give bad contrast if used
        'colors-dark': { background: '#ffffff' }, // same
        overrides: {
          dark: {
            'surface-page': '#000000', // this is the correct dark bg
            'text-primary': 'rgba(255, 255, 255, 0.87)',
            'text-tertiary': 'rgba(255, 255, 255, 0.55)',
          },
        },
      };
      const results = checkThemeContrast({ theme, filename: 'surface-page-test.visor.yaml' });
      const failures = results.filter((r) => !r.pass);
      // If surface-page is used as bg (#000000), contrast passes.
      // If colors.background (#ffffff) were incorrectly used, rgba white on white fails hard.
      expect(failures).toHaveLength(0);
    });

    it('falls back to colors-dark.background for dark mode', () => {
      const theme = {
        name: 'fallback-test',
        colors: { background: '#ffffff' },
        'colors-dark': { background: '#000000' },
        overrides: {
          dark: {
            'text-primary': 'rgba(255, 255, 255, 0.87)',
            'text-tertiary': 'rgba(255, 255, 255, 0.55)',
          },
        },
      };
      const results = checkThemeContrast({ theme, filename: 'fallback-test.visor.yaml' });
      const failures = results.filter((r) => !r.pass);
      expect(failures).toHaveLength(0);
    });
  });

  describe('both dark and light modes checked', () => {
    it('checks text tokens in both dark and light mode overrides', () => {
      const theme = {
        name: 'both-modes-test',
        colors: { background: '#ffffff' },
        'colors-dark': { background: '#000000' },
        overrides: {
          dark: {
            'text-primary': 'rgba(255, 255, 255, 0.87)',
            'text-tertiary': 'rgba(255, 255, 255, 0.55)',
          },
          light: {
            'text-primary': '#18181b',
            'text-tertiary': '#71717a',
          },
        },
      };
      const results = checkThemeContrast({ theme, filename: 'both-modes-test.visor.yaml' });
      const darkResults = results.filter((r) => r.message.includes('(dark)') || r.message.includes('dark'));
      const lightResults = results.filter((r) => r.message.includes('(light)') || r.message.includes('light'));
      expect(darkResults.length).toBeGreaterThan(0);
      expect(lightResults.length).toBeGreaterThan(0);
    });
  });

  describe('integration — rule.run() on disk themes', () => {
    it('returns at least one result (finds theme YAML files)', async () => {
      const results = await themeTextContrast.run();
      expect(results.length).toBeGreaterThan(0);
    });

    it('all results have required fields (pass, message)', async () => {
      const results = await themeTextContrast.run();
      for (const r of results) {
        expect(typeof r.pass).toBe('boolean');
        expect(typeof r.message).toBe('string');
        expect(r.message.length).toBeGreaterThan(0);
      }
    });

    it('failure results include filename, token name, ratio, and requirement in message', async () => {
      const results = await themeTextContrast.run();
      const failures = results.filter((r) => !r.pass);
      for (const f of failures) {
        // Each failure message must be actionable
        expect(f.message).toMatch(/requires 4\.5:1 for AA normal text/);
        expect(f.message).toMatch(/\d+\.\d+:1/);
      }
    });
  });
});
