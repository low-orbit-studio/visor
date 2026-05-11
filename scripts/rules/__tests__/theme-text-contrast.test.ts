import { describe, it, expect } from 'vitest';
import {
  themeTextContrast,
  checkThemeContrast,
  type ResolvedTokenColors,
} from '../theme-text-contrast.js';

// ---------------------------------------------------------------------------
// Unit tests for checkThemeContrast (no disk I/O — in-memory resolved tokens)
// ---------------------------------------------------------------------------

/** Helper: build a fully-resolved single-mode token map for tests. */
function buildResolved(
  mode: 'dark' | 'light',
  texts: { primary?: string; secondary?: string; tertiary?: string },
  surfaces: { page?: string; card?: string; muted?: string; popover?: string },
): { [k in 'dark' | 'light']?: ResolvedTokenColors } {
  return {
    [mode]: { text: { ...texts }, surface: { ...surfaces } },
  };
}

describe('theme-text-contrast rule', () => {
  it('has correct metadata', () => {
    expect(themeTextContrast.name).toBe('theme-text-contrast');
    expect(themeTextContrast.category).toBe('tokens');
    expect(themeTextContrast.warnOnly).toBeUndefined(); // failures block CI
    expect(themeTextContrast.description).toContain('4.5:1');
    expect(themeTextContrast.description).toContain('text-disabled');
  });

  describe('passing theme — text-tertiary alpha 0.55 on black', () => {
    const resolved = buildResolved(
      'dark',
      {
        primary: 'rgba(255, 255, 255, 0.87)',
        secondary: 'rgba(255, 255, 255, 0.70)',
        tertiary: 'rgba(255, 255, 255, 0.55)',
      },
      {
        page: '#000000',
        card: '#000000',
        muted: '#000000',
        popover: '#000000',
      },
    );

    it('returns no failures', () => {
      const results = checkThemeContrast({
        resolved,
        themeName: 'passing-test',
        filename: 'passing-test.visor.yaml',
      });
      const failures = results.filter((r) => !r.pass);
      expect(failures).toHaveLength(0);
    });

    it('text-tertiary at alpha 0.55 on black passes AA (>= 4.5:1)', () => {
      const results = checkThemeContrast({
        resolved,
        themeName: 'passing-test',
        filename: 'passing-test.visor.yaml',
      });
      const tertiary = results.find((r) => r.message.includes('text-tertiary'));
      expect(tertiary).toBeDefined();
      expect(tertiary?.pass).toBe(true);
      const ratioMatch = tertiary?.message.match(/([\d.]+):1/);
      expect(ratioMatch).not.toBeNull();
      if (ratioMatch) {
        expect(parseFloat(ratioMatch[1])).toBeGreaterThanOrEqual(4.5);
      }
    });
  });

  describe('failing theme — text-tertiary alpha 0.20 on black (~1.17:1)', () => {
    const resolved = buildResolved(
      'dark',
      {
        primary: 'rgba(255, 255, 255, 0.87)',
        secondary: 'rgba(255, 255, 255, 0.70)',
        tertiary: 'rgba(255, 255, 255, 0.20)',
      },
      { page: '#000000' },
    );

    it('returns failure for text-tertiary', () => {
      const results = checkThemeContrast({
        resolved,
        themeName: 'failing-test',
        filename: 'failing-test.visor.yaml',
      });
      const failures = results.filter((r) => !r.pass);
      expect(failures.length).toBeGreaterThan(0);
      expect(failures.some((f) => f.message.includes('text-tertiary'))).toBe(true);
    });

    it('failure message includes token, surface, mode, ratio, and target', () => {
      const results = checkThemeContrast({
        resolved,
        themeName: 'failing-test',
        filename: 'failing-test.visor.yaml',
      });
      const failure = results.find((r) => !r.pass);
      expect(failure).toBeDefined();
      expect(failure?.message).toMatch(/failing-test\.visor\.yaml/);
      expect(failure?.message).toMatch(/text-tertiary/);
      expect(failure?.message).toMatch(/surface-page/);
      expect(failure?.message).toMatch(/\(dark\)/);
      expect(failure?.message).toMatch(/target ≥ 4\.5:1/);
    });

    it('failure message ratio is < 4.5', () => {
      const results = checkThemeContrast({
        resolved,
        themeName: 'failing-test',
        filename: 'failing-test.visor.yaml',
      });
      const failure = results.find((r) => !r.pass);
      const ratioMatch = failure?.message.match(/is ([\d.]+):1/);
      expect(ratioMatch).not.toBeNull();
      if (ratioMatch) {
        expect(parseFloat(ratioMatch[1])).toBeLessThan(4.5);
      }
    });

    it('file property on result matches filename', () => {
      const results = checkThemeContrast({
        resolved,
        themeName: 'failing-test',
        filename: 'failing-test.visor.yaml',
      });
      const failure = results.find((r) => !r.pass);
      expect(failure?.file).toBe('failing-test.visor.yaml');
    });
  });

  describe('text-disabled exemption (regression)', () => {
    // text-disabled is not in CHECKED_TEXT_TOKENS, so even if it would fail,
    // no result for it should ever be emitted. This pins the WCAG 1.4.3
    // exemption against future regressions.
    const resolved = buildResolved(
      'dark',
      {
        primary: 'rgba(255, 255, 255, 0.87)',
        secondary: 'rgba(255, 255, 255, 0.70)',
        tertiary: 'rgba(255, 255, 255, 0.55)',
      },
      {
        page: '#000000',
        card: '#000000',
        muted: '#000000',
        popover: '#000000',
      },
    );
    // Add text-disabled to the resolved object via cast — verifying it's ignored.
    resolved.dark!.text = {
      ...resolved.dark!.text,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...({ disabled: 'rgba(255, 255, 255, 0.10)' } as any),
    };

    it('does not emit any result for text-disabled', () => {
      const results = checkThemeContrast({
        resolved,
        themeName: 'disabled-test',
        filename: 'disabled-test.visor.yaml',
      });
      const disabledResults = results.filter((r) => r.message.includes('text-disabled'));
      expect(disabledResults).toHaveLength(0);
    });

    it('all non-disabled tokens still pass', () => {
      const results = checkThemeContrast({
        resolved,
        themeName: 'disabled-test',
        filename: 'disabled-test.visor.yaml',
      });
      const failures = results.filter((r) => !r.pass);
      expect(failures).toHaveLength(0);
    });
  });

  describe('elevated-surface checks (VI-348)', () => {
    it('text-tertiary failing AA against surface-muted emits a violation', () => {
      // dark page is fine for tertiary, but a near-tertiary-luminance muted is not.
      const resolved = buildResolved(
        'dark',
        {
          primary: 'rgba(255, 255, 255, 0.87)',
          secondary: 'rgba(255, 255, 255, 0.70)',
          tertiary: 'rgba(255, 255, 255, 0.55)',
        },
        {
          page: '#000000',
          card: '#000000',
          // gray surface chosen to make text-tertiary fail (text composed to ~#8c8c8c)
          muted: '#777777',
          popover: '#000000',
        },
      );
      const results = checkThemeContrast({
        resolved,
        themeName: 'muted-fail',
        filename: 'muted-fail.visor.yaml',
      });
      const muted = results.filter((r) => r.message.includes('surface-muted'));
      const failures = muted.filter((r) => !r.pass);
      const tertiaryFail = failures.find((r) => r.message.includes('text-tertiary'));
      expect(tertiaryFail).toBeDefined();
    });

    it('text-secondary failing AA against surface-card emits a violation', () => {
      const resolved = buildResolved(
        'light',
        {
          primary: '#18181b',
          // very low contrast on the light card defined below
          secondary: '#cccccc',
          tertiary: '#666666',
        },
        {
          page: '#ffffff',
          card: '#dddddd', // nearly-identical luminance to text-secondary
          muted: '#ffffff',
          popover: '#ffffff',
        },
      );
      const results = checkThemeContrast({
        resolved,
        themeName: 'card-fail',
        filename: 'card-fail.visor.yaml',
      });
      const card = results.filter((r) => r.message.includes('surface-card'));
      const failures = card.filter((r) => !r.pass);
      const secondaryFail = failures.find((r) => r.message.includes('text-secondary'));
      expect(secondaryFail).toBeDefined();
    });

    it('text-primary failing AA against surface-popover emits a violation', () => {
      const resolved = buildResolved(
        'dark',
        {
          // intentionally too-dark for a dark popover
          primary: '#333333',
          secondary: 'rgba(255, 255, 255, 0.70)',
          tertiary: 'rgba(255, 255, 255, 0.55)',
        },
        {
          page: '#000000',
          card: '#000000',
          muted: '#000000',
          popover: '#222222', // dark-on-dark
        },
      );
      const results = checkThemeContrast({
        resolved,
        themeName: 'popover-fail',
        filename: 'popover-fail.visor.yaml',
      });
      const popover = results.filter((r) => r.message.includes('surface-popover'));
      const failures = popover.filter((r) => !r.pass);
      const primaryFail = failures.find((r) => r.message.includes('text-primary'));
      expect(primaryFail).toBeDefined();
    });

    it('alpha-composited surface token produces a sensible composed value before ratio', () => {
      // Blackout-style: surface-card is rgba(white, 0.04) over near-black page.
      // After compositing, surface becomes ~#0a0a0a; light text passes easily.
      const resolved = buildResolved(
        'dark',
        {
          primary: 'rgba(255, 255, 255, 0.87)',
          secondary: 'rgba(255, 255, 255, 0.70)',
          tertiary: 'rgba(255, 255, 255, 0.55)',
        },
        {
          page: '#000000',
          card: 'rgba(255, 255, 255, 0.04)',
          muted: 'rgba(255, 255, 255, 0.04)',
          popover: '#141414',
        },
      );
      const results = checkThemeContrast({
        resolved,
        themeName: 'blackout-style',
        filename: 'blackout-style.visor.yaml',
      });
      // All checks should pass — the composite() helper must produce sensible
      // dark-grey surfaces from rgba/alpha values rather than treating them as opaque white.
      const failures = results.filter((r) => !r.pass);
      expect(failures).toHaveLength(0);

      // And the resolved surface hex emitted in pass messages should not be white-ish.
      const cardMessage = results.find((r) => r.message.includes('surface-card'));
      expect(cardMessage).toBeDefined();
      // The composited card is #0a0a0a — very dark, NOT white.
      // (We don't expose the hex in passing messages, but check that we got a
      //  high-ratio pass which only happens if compositing worked.)
      const ratioMatch = cardMessage?.message.match(/([\d.]+):1/);
      expect(ratioMatch).not.toBeNull();
      if (ratioMatch) {
        expect(parseFloat(ratioMatch[1])).toBeGreaterThan(4.5);
      }
    });

    it('emits up to 24 checks (3 tokens × 4 surfaces × 2 modes) per theme', () => {
      const resolved: { dark?: ResolvedTokenColors; light?: ResolvedTokenColors } = {
        dark: {
          text: {
            primary: '#ffffff',
            secondary: '#dddddd',
            tertiary: '#bbbbbb',
          },
          surface: {
            page: '#000000',
            card: '#0a0a0a',
            muted: '#101010',
            popover: '#141414',
          },
        },
        light: {
          text: {
            primary: '#000000',
            secondary: '#333333',
            tertiary: '#555555',
          },
          surface: {
            page: '#ffffff',
            card: '#f5f5f5',
            muted: '#ebebeb',
            popover: '#ffffff',
          },
        },
      };
      const results = checkThemeContrast({
        resolved,
        themeName: 'full-coverage',
        filename: 'full-coverage.visor.yaml',
      });
      expect(results).toHaveLength(24);
    });
  });

  describe('hex color text values', () => {
    const resolved = buildResolved(
      'light',
      {
        primary: '#18181b',
        secondary: '#52525b',
        tertiary: '#71717a',
      },
      { page: '#ffffff', card: '#ffffff', muted: '#ffffff', popover: '#ffffff' },
    );

    it('handles hex color values for text tokens', () => {
      const results = checkThemeContrast({
        resolved,
        themeName: 'hex-test',
        filename: 'hex-test.visor.yaml',
      });
      expect(results.length).toBeGreaterThan(0);
    });

    it('text-primary #18181b on #ffffff passes AA', () => {
      const results = checkThemeContrast({
        resolved,
        themeName: 'hex-test',
        filename: 'hex-test.visor.yaml',
      });
      const primary = results.find(
        (r) => r.message.includes('text-primary') && r.message.includes('surface-page'),
      );
      expect(primary?.pass).toBe(true);
    });
  });

  describe('both dark and light modes checked', () => {
    it('checks text tokens in both dark and light mode', () => {
      const resolved: { dark?: ResolvedTokenColors; light?: ResolvedTokenColors } = {
        dark: {
          text: {
            primary: 'rgba(255, 255, 255, 0.87)',
            tertiary: 'rgba(255, 255, 255, 0.55)',
          },
          surface: {
            page: '#000000',
            card: '#000000',
            muted: '#000000',
            popover: '#000000',
          },
        },
        light: {
          text: { primary: '#18181b', tertiary: '#71717a' },
          surface: {
            page: '#ffffff',
            card: '#ffffff',
            muted: '#ffffff',
            popover: '#ffffff',
          },
        },
      };
      const results = checkThemeContrast({
        resolved,
        themeName: 'both-modes-test',
        filename: 'both-modes-test.visor.yaml',
      });
      const darkResults = results.filter((r) => r.message.includes('(dark)') || r.message.match(/\bdark\b/));
      const lightResults = results.filter((r) => r.message.includes('(light)') || r.message.match(/\blight\b/));
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

    it('failure messages name the surface and target ratio (when present)', async () => {
      const results = await themeTextContrast.run();
      const failures = results.filter((r) => !r.pass);
      for (const f of failures) {
        expect(f.message).toMatch(/target ≥ 4\.5:1/);
        expect(f.message).toMatch(/\d+\.\d+:1/);
        // Surface name must appear in every failure (D7 message format).
        expect(f.message).toMatch(/surface-(page|card|muted|popover)/);
      }
    });

    it('stock themes pass cleanly (D6 + VI-348 stock overrides)', async () => {
      const results = await themeTextContrast.run();
      const STOCK_SLUGS = ['blackout', 'borderless', 'modern-minimal', 'neutral', 'space'];
      const stockFailures = results
        .filter((r) => !r.pass)
        .filter((r) => STOCK_SLUGS.some((slug) => (r.file ?? '').includes(`${slug}.visor.yaml`)));
      expect(stockFailures).toEqual([]);
    });
  });
});
