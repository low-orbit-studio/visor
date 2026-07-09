import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  tokenResolutionTransparency,
  parseRgba,
  composite,
  relativeLuminance,
  evaluateIntent,
  isAllowlisted,
  buildProbeHtml,
  EPSILON_LUM,
  SURFACE_INTENTS,
} from '../token-resolution-transparency.js';

// ---------------------------------------------------------------------------
// Rule metadata
// ---------------------------------------------------------------------------

describe('token-resolution-transparency rule', () => {
  it('has correct metadata', () => {
    expect(tokenResolutionTransparency.name).toBe('token-resolution-transparency');
    expect(tokenResolutionTransparency.category).toBe('tokens');
    expect(tokenResolutionTransparency.warnOnly).toBeUndefined(); // failures block CI
    expect(tokenResolutionTransparency.description).toContain('getComputedStyle');
  });

  it('seeds the doc-nav pill exemplar (VI-611/612) as a recessed assertion', () => {
    const docNav = SURFACE_INTENTS.find((a) => a.component === 'doc-nav');
    expect(docNav).toBeDefined();
    expect(docNav?.intent).toBe('recessed');
    expect(docNav?.container ?? '--surface-card').toBe('--surface-card');
  });
});

// ---------------------------------------------------------------------------
// parseRgba — handles both computed-color forms Chromium emits
// ---------------------------------------------------------------------------

describe('parseRgba', () => {
  it('parses rgb()', () => {
    expect(parseRgba('rgb(24, 24, 27)')).toEqual([24, 24, 27, 1]);
  });
  it('parses rgba() with alpha', () => {
    expect(parseRgba('rgba(255, 255, 255, 0.04)')).toEqual([255, 255, 255, 0.04]);
  });
  it('parses color(srgb ...) — the form a resolved color-mix() produces', () => {
    // `--doc-nav-pill-bg` resolves to exactly this in Chromium.
    const parsed = parseRgba('color(srgb 0.0823529 0.0823529 0.0941176)');
    expect(parsed).not.toBeNull();
    expect(parsed![0]).toBeCloseTo(21, 0);
    expect(parsed![2]).toBeCloseTo(24, 0);
    expect(parsed![3]).toBe(1);
  });
  it('parses color(srgb ... / alpha)', () => {
    const parsed = parseRgba('color(srgb 0.1 0.1 0.1 / 0.5)');
    expect(parsed![3]).toBe(0.5);
  });
  it('returns null for unrecognised input', () => {
    expect(parseRgba('not-a-color')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Color math
// ---------------------------------------------------------------------------

describe('composite + relativeLuminance', () => {
  it('composites a translucent surface over an opaque background', () => {
    // white @ 4% over near-black page → a barely-lifted surface
    expect(composite([255, 255, 255, 0.04], [9, 9, 11])).toEqual([19, 19, 21]);
  });
  it('luminance is 0 for black and 1 for white', () => {
    expect(relativeLuminance(0, 0, 0)).toBeCloseTo(0, 5);
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1, 5);
  });
});

// ---------------------------------------------------------------------------
// evaluateIntent — the pure comparator that reproduces the VI-611/612 finding
// ---------------------------------------------------------------------------

describe('evaluateIntent', () => {
  // These RGB values were resolved from the REAL browser (getComputedStyle) on
  // the neutral theme in dark mode — NOT a string CSS engine (W-111). They are
  // the pre-VI-612 doc-nav trap: a pill using `--surface-subtle` as a "recessed"
  // well while the card it sits in is `--surface-card`.
  const NEUTRAL_DARK_CARD = [24, 24, 27] as [number, number, number]; // --surface-card #18181b
  const NEUTRAL_DARK_SUBTLE = [45, 45, 52] as [number, number, number]; // --surface-subtle #2d2d34
  const DOC_NAV_PILL_FIX = [21, 21, 24] as [number, number, number]; // --doc-nav-pill-bg (card→neutral-950)

  it('FLAGS the pre-VI-612 inversion: --surface-subtle reads LIGHTER than its card container', () => {
    const verdict = evaluateIntent({
      tokenRgb: NEUTRAL_DARK_SUBTLE,
      containerRgb: NEUTRAL_DARK_CARD,
      intent: 'recessed',
    });
    expect(verdict.pass).toBe(false); // the token name lied — subtle rendered raised
    expect(verdict.delta).toBeGreaterThan(EPSILON_LUM);
  });

  it('PASSES the VI-612 fix: --doc-nav-pill-bg reads darker than the card', () => {
    const verdict = evaluateIntent({
      tokenRgb: DOC_NAV_PILL_FIX,
      containerRgb: NEUTRAL_DARK_CARD,
      intent: 'recessed',
    });
    expect(verdict.pass).toBe(true);
    expect(verdict.delta).toBeLessThan(0);
  });

  it('FLAGS a "raised" surface that renders darker than its container', () => {
    const verdict = evaluateIntent({
      tokenRgb: [10, 10, 12],
      containerRgb: [24, 24, 27],
      intent: 'raised',
    });
    expect(verdict.pass).toBe(false);
  });

  it('does NOT flag a hairline-defined surface (near-equal luminance)', () => {
    // A well separated by a border, not a fill shift — the legit case the ticket
    // says must not flood as a false positive.
    const verdict = evaluateIntent({
      tokenRgb: [24, 24, 28],
      containerRgb: [24, 24, 27],
      intent: 'recessed',
    });
    expect(verdict.pass).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Allowlist override
// ---------------------------------------------------------------------------

describe('isAllowlisted', () => {
  it('exempts a token for all themes/modes with the base key', () => {
    expect(isAllowlisted(['doc-nav:--surface-subtle'], 'doc-nav', '--surface-subtle', 'neutral', 'dark')).toBe(true);
  });
  it('exempts a single theme:mode with the scoped key', () => {
    const allow = ['doc-nav:--surface-subtle@neutral:dark'];
    expect(isAllowlisted(allow, 'doc-nav', '--surface-subtle', 'neutral', 'dark')).toBe(true);
    expect(isAllowlisted(allow, 'doc-nav', '--surface-subtle', 'space', 'dark')).toBe(false);
  });
  it('does not exempt an unrelated assertion', () => {
    expect(isAllowlisted(['other:--x'], 'doc-nav', '--surface-subtle', 'neutral', 'dark')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// End-to-end real-browser reproduction (skips where chromium is unavailable)
// ---------------------------------------------------------------------------

describe('real-browser resolution reproduces the pre-VI-612 finding', () => {
  // Minimal structural type for the slice of Playwright this test drives —
  // avoids depending on `playwright`'s published types (optional browser dep).
  interface BrowserLike {
    newContext(opts: { colorScheme: 'light' | 'dark' }): Promise<{
      newPage(): Promise<{
        setContent(html: string, opts: { waitUntil: 'load' }): Promise<void>;
        evaluate(expression: string): Promise<unknown>;
      }>;
      close(): Promise<void>;
    }>;
    close(): Promise<void>;
  }

  const cwd = process.cwd();
  const themeCssPath = resolve(cwd, 'packages/docs/app/neutral-theme.css');
  const tokensCssPath = resolve(cwd, 'packages/tokens/dist/tokens.css');
  const docNavCssPath = resolve(cwd, 'components/ui/doc-nav/doc-nav.module.css');

  let browser: BrowserLike | null = null;

  beforeAll(async () => {
    if (!existsSync(themeCssPath)) return;
    for (const mod of ['playwright', '@playwright/test']) {
      try {
        const { chromium } = (await import(mod)) as { chromium: { launch: () => Promise<BrowserLike> } };
        browser = await chromium.launch();
        break;
      } catch {
        browser = null; // chromium not installed — test self-skips below
      }
    }
  }, 60_000);

  afterAll(async () => {
    if (browser) await browser.close();
  });

  async function resolveComposited(
    token: string,
    container: string,
    mode: 'light' | 'dark',
  ): Promise<{ tokenRgb: [number, number, number]; containerRgb: [number, number, number] }> {
    const tokensCss = existsSync(tokensCssPath) ? readFileSync(tokensCssPath, 'utf-8') : '';
    const themeCss = readFileSync(themeCssPath, 'utf-8');
    const componentCss = existsSync(docNavCssPath) ? readFileSync(docNavCssPath, 'utf-8') : '';
    const html = buildProbeHtml({
      tokensCss,
      themeCss,
      componentCss,
      themeSlug: 'neutral',
      scopeClass: 'root',
      mode,
      tokens: ['--surface-page', container, token],
    });
    const context = await browser.newContext({ colorScheme: mode });
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const raw = (await page.evaluate(
      `(function(){var o={};document.querySelectorAll('[data-token]').forEach(function(e){o[e.getAttribute('data-token')]=getComputedStyle(e).backgroundColor});return o})()`,
    )) as Record<string, string>;
    await context.close();
    const pageRgb = composite(parseRgba(raw['--surface-page'])!, [0, 0, 0]);
    const containerRgb = composite(parseRgba(raw[container])!, pageRgb);
    const tokenRgb = composite(parseRgba(raw[token])!, containerRgb);
    return { tokenRgb, containerRgb };
  }

  it('flags --surface-subtle-as-recessed on neutral dark (the exact VI-611/612 trap)', async (ctx) => {
    if (!browser) return ctx.skip();
    const { tokenRgb, containerRgb } = await resolveComposited('--surface-subtle', '--surface-card', 'dark');
    const verdict = evaluateIntent({ tokenRgb, containerRgb, intent: 'recessed' });
    expect(verdict.pass).toBe(false); // subtle rendered LIGHTER than card — inversion
    expect(verdict.delta).toBeGreaterThan(EPSILON_LUM);
  }, 30_000);

  it('passes the shipped fix --doc-nav-pill-bg-as-recessed on neutral dark', async (ctx) => {
    if (!browser) return ctx.skip();
    const { tokenRgb, containerRgb } = await resolveComposited('--doc-nav-pill-bg', '--surface-card', 'dark');
    const verdict = evaluateIntent({ tokenRgb, containerRgb, intent: 'recessed' });
    expect(verdict.pass).toBe(true); // the color-mix fix reads darker than the card
  }, 30_000);
});
