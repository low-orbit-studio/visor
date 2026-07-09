import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  resolveThemeCssFile,
  resolveTokensCssFile,
} from '../../packages/cli/src/commands/render.js';
import type { Rule, RuleResult } from './types.js';

/**
 * token-resolution-transparency (BO-68) — "the token name lied" check.
 *
 * Per theme × mode, resolves what each surface `var(--token)` a component uses
 * ACTUALLY computes to, in a REAL browser via `getComputedStyle` — then flags
 * semantic-intent-vs-rendered mismatches. The canonical trap (VI-611/VI-612):
 * an element using a "recessed"/"sunken"/"subtle" well surface that resolves
 * LIGHTER than the card it sits in — dark themes lift `--surface-subtle` above
 * the card, so a pill meant to read as a recessed well reads as a raised chip.
 *
 * Mechanism (W-111): the values come from a real browser's `getComputedStyle`,
 * NEVER a regex/string CSS engine. W-111's predecessor tried a ~180-line regex
 * CSS engine and it was the wrong approach — `color-mix()`, `var()` chains, and
 * alpha compositing only resolve correctly in a real rendering engine. This
 * rule reuses BO-66's `visor render` browser path (same emitted-CSS sources —
 * `packages/tokens/dist/tokens.css` + `packages/docs/app/<slug>-theme.css`, and
 * the same Playwright `getComputedStyle` probe), rather than re-deriving values
 * from the TS source maps (adaptive.ts + theme-engine semantic-map.ts drift).
 *
 * Intent is COMPONENT-DECLARED, not token-name-guessed. Empirically, the bare
 * name `--surface-subtle` is NOT a reliable "recessed" signal: neutral/space/
 * borderless dark themes intentionally lift it ABOVE the card (input controls,
 * hover surfaces), so a pure name heuristic would flood 20+ components with
 * false positives. Instead a component asserts, in `SURFACE_INTENTS` below, that
 * a specific surface token it uses is meant to read "recessed" (≤ its container)
 * or "raised" (≥ its container). This is the blessed "bind by intentional
 * annotation" pattern from W-111 — the check runs default-on every `validate`;
 * the annotation only supplies the expected intent. It is also the finally-
 * adopted `[data-specimen]` + `getComputedStyle` methodology prescribed by the
 * design-system deep-dive `visual-regression-testing.md` §5 (grep previously = 0).
 *
 * Overrides (documented in docs/token-rules.md): a repo-root `.visorrc.json`
 * (same file `visor check design` reads) can disable the whole rule via
 *   { "disabledRules": ["token-resolution-transparency"] }
 * or exempt a single legit near-container / hairline-defined case via
 *   { "surfaceIntentAllow": ["<component>:<token>@<theme>:<mode>"] }
 * (the theme:mode suffix is optional — `"<component>:<token>"` exempts all).
 */

// ---------------------------------------------------------------------------
// Intent model + component-declared assertions
// ---------------------------------------------------------------------------

export type SurfaceIntent = 'recessed' | 'raised';

export interface SurfaceIntentAssertion {
  /** Component slug — used for messages, CSS lookup, and allowlist keys. */
  component: string;
  /** The CSS custom property the component uses as this surface's background. */
  token: string;
  /** recessed ⇒ must render ≤ container luminance; raised ⇒ ≥ container. */
  intent: SurfaceIntent;
  /** The surface the element sits ON. Defaults to `--surface-card`. */
  container?: string;
  /** Class carrying the component-local var definition (default `root`). */
  scopeClass?: string;
}

/**
 * Component-declared surface-intent assertions. Seeded with the doc-nav
 * exemplar (VI-611/VI-612): the pill is a recessed well inside a card-backed
 * group. Its resting fill routes through `--doc-nav-pill-bg` (the card mixed
 * ~20% toward `--color-neutral-950`), which is guaranteed darker than the card
 * in BOTH modes — the fix for the original `--surface-subtle` inversion. This
 * assertion holds the fix in place across every theme: swap the token back to a
 * raw `--surface-subtle` and this rule fails on neutral/space/borderless dark.
 */
export const SURFACE_INTENTS: SurfaceIntentAssertion[] = [
  {
    component: 'doc-nav',
    token: '--doc-nav-pill-bg',
    intent: 'recessed',
    container: '--surface-card',
  },
];

/**
 * Minimum luminance delta (0–1 relative luminance) that counts as a real
 * inversion. Below this, two surfaces are perceptually the same — the legit
 * "hairline-defined surface" case (a well separated by a border, not a fill
 * shift), which must NOT flood as a false positive.
 */
export const EPSILON_LUM = 0.005;

// ---------------------------------------------------------------------------
// Color math (mirrors scripts/rules/theme-text-contrast.ts)
// ---------------------------------------------------------------------------

type Rgb = [number, number, number];

/**
 * Parse a computed color string into `[r, g, b, a]` (rgb 0–255, alpha 0–1).
 * Handles both forms `getComputedStyle().backgroundColor` returns in Chromium:
 *   - `rgb(24, 24, 27)` / `rgba(24, 24, 27, 0.5)` — channels 0–255
 *   - `color(srgb 0.094 0.094 0.106 / 0.5)` — the form a resolved `color-mix()`
 *     produces — channels 0–1, scaled to 0–255 here.
 */
export function parseRgba(value: string): [number, number, number, number] | null {
  const srgb = value.match(
    /color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/i,
  );
  if (srgb) {
    return [
      parseFloat(srgb[1]) * 255,
      parseFloat(srgb[2]) * 255,
      parseFloat(srgb[3]) * 255,
      srgb[4] !== undefined ? parseFloat(srgb[4]) : 1,
    ];
  }
  const rgb = value.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)/i);
  if (rgb) {
    return [parseFloat(rgb[1]), parseFloat(rgb[2]), parseFloat(rgb[3]), rgb[4] !== undefined ? parseFloat(rgb[4]) : 1];
  }
  return null;
}

/** Alpha-composite a possibly-translucent color over an opaque background. */
export function composite(fg: [number, number, number, number], bg: Rgb): Rgb {
  const [r, g, b, a] = fg;
  return [
    Math.round(r * a + bg[0] * (1 - a)),
    Math.round(g * a + bg[1] * (1 - a)),
    Math.round(b * a + bg[2] * (1 - a)),
  ];
}

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG 2.1 relative luminance from [r, g, b] (0–255). */
export function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

// ---------------------------------------------------------------------------
// Pure intent comparator (unit-tested WITHOUT a browser)
// ---------------------------------------------------------------------------

export interface IntentVerdict {
  pass: boolean;
  tokenLum: number;
  containerLum: number;
  /** tokenLum − containerLum. Positive ⇒ token is lighter than container. */
  delta: number;
}

/**
 * Compare a resolved token color against its resolved container color for the
 * declared intent. `recessed` fails when the token is meaningfully LIGHTER than
 * its container (the inversion); `raised` fails when meaningfully DARKER.
 */
export function evaluateIntent(opts: {
  tokenRgb: Rgb;
  containerRgb: Rgb;
  intent: SurfaceIntent;
  epsilon?: number;
}): IntentVerdict {
  const epsilon = opts.epsilon ?? EPSILON_LUM;
  const tokenLum = relativeLuminance(...opts.tokenRgb);
  const containerLum = relativeLuminance(...opts.containerRgb);
  const delta = tokenLum - containerLum;
  const pass =
    opts.intent === 'recessed' ? delta <= epsilon : delta >= -epsilon;
  return { pass, tokenLum, containerLum, delta };
}

// ---------------------------------------------------------------------------
// .visorrc.json overrides (mirrors packages/cli/src/check/design.ts loadVisorRc)
// ---------------------------------------------------------------------------

interface VisorRc {
  disabledRules?: string[];
  /** `<component>:<token>` or `<component>:<token>@<theme>:<mode>`. */
  surfaceIntentAllow?: string[];
}

export function loadVisorRc(dir: string): VisorRc {
  const rcPath = join(dir, '.visorrc.json');
  if (!existsSync(rcPath)) return {};
  try {
    return JSON.parse(readFileSync(rcPath, 'utf-8')) as VisorRc;
  } catch {
    return {};
  }
}

/** Is this (component, token, theme, mode) exempted by the allowlist? */
export function isAllowlisted(
  allow: string[],
  component: string,
  token: string,
  theme: string,
  mode: string,
): boolean {
  const base = `${component}:${token}`;
  const scoped = `${base}@${theme}:${mode}`;
  return allow.includes(base) || allow.includes(scoped);
}

// ---------------------------------------------------------------------------
// Browser resolution — the real getComputedStyle path (reuses BO-66's compose)
// ---------------------------------------------------------------------------

async function loadPlaywright(): Promise<any | null> {
  for (const mod of ['playwright', '@playwright/test']) {
    try {
      return await import(mod);
    } catch {
      /* try next */
    }
  }
  return null;
}

/**
 * Compose the standalone document (base tokens → per-theme CSS → component CSS),
 * exactly like `visor render`'s cascade: mode via `.dark` on <html>, the theme
 * class on the scope div, and specimens carrying each token as a background so
 * the browser resolves `var()` / `color-mix()` / alpha for us.
 */
export function buildProbeHtml(opts: {
  tokensCss: string;
  themeCss: string;
  componentCss: string;
  themeSlug: string;
  scopeClass: string;
  mode: 'light' | 'dark';
  tokens: string[];
}): string {
  const specimens = opts.tokens
    .map((t) => `<div data-token="${t}" style="background-color: var(${t})"></div>`)
    .join('');
  return `<!doctype html>
<html lang="en" class="${opts.mode === 'dark' ? 'dark' : ''}" style="color-scheme: ${opts.mode}">
<head><meta charset="utf-8" />
<style>${opts.tokensCss}</style>
<style>${opts.themeCss}</style>
<style>${opts.componentCss}</style>
</head>
<body><div class="${opts.themeSlug}-theme"><div class="${opts.scopeClass}">${specimens}</div></div></body>
</html>`;
}

interface ThemeTarget {
  slug: string;
  cssFile: string;
}

/** Discover the emitted per-theme CSS files (`packages/docs/app/<slug>-theme.css`). */
function discoverThemes(cwd: string): ThemeTarget[] {
  const appDir = resolve(cwd, 'packages', 'docs', 'app');
  if (!existsSync(appDir)) return [];
  return readdirSync(appDir)
    .filter((f) => f.endsWith('-theme.css'))
    .map((f) => ({ slug: f.replace('-theme.css', ''), cssFile: join(appDir, f) }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

// ---------------------------------------------------------------------------
// Rule
// ---------------------------------------------------------------------------

export const tokenResolutionTransparency: Rule = {
  name: 'token-resolution-transparency',
  description:
    'Component-declared "recessed"/"raised" surface tokens resolve on the correct ' +
    'side of their container in every theme × mode (real-browser getComputedStyle, ' +
    'not a string CSS engine) — catches "the token name lied" inversions (VI-611/612).',
  category: 'tokens',
  async run(): Promise<RuleResult[]> {
    const cwd = process.cwd();
    const results: RuleResult[] = [];

    const rc = loadVisorRc(cwd);
    const allow = rc.surfaceIntentAllow ?? [];

    if (SURFACE_INTENTS.length === 0) {
      return [{ pass: true, message: 'No surface-intent assertions registered.' }];
    }

    const themes = discoverThemes(cwd);
    if (themes.length === 0) {
      return [{ pass: true, message: 'No emitted per-theme CSS found to resolve against.' }];
    }

    const tokensCssFile = resolveTokensCssFile(cwd);
    const tokensCss = tokensCssFile ? readFileSync(tokensCssFile, 'utf-8') : '';

    const playwright = await loadPlaywright();
    if (!playwright?.chromium) {
      // Graceful skip — the rule needs a real browser (W-111: no regex fallback).
      // Runs fully wherever chromium is installed (local dev + browser-capable CI).
      return [
        {
          pass: true,
          message:
            'token-resolution-transparency: skipped — Playwright/chromium not installed ' +
            '(install with `npm i -D playwright && npx playwright install chromium`).',
        },
      ];
    }

    // Pre-read each assertion's component CSS (defines component-local tokens).
    const assertions = await Promise.all(
      SURFACE_INTENTS.map(async (a) => {
        const cssPath = resolve(cwd, 'components', 'ui', a.component, `${a.component}.module.css`);
        let componentCss = '';
        try {
          componentCss = await readFile(cssPath, 'utf-8');
        } catch {
          /* component may declare a theme-level token needing no local CSS */
        }
        return { ...a, componentCss };
      }),
    );

    let browser: any;
    try {
      browser = await playwright.chromium.launch();
    } catch {
      // Package present but browser binary absent (e.g. CI lint job runs `npm ci`
      // but not `npx playwright install chromium`). Skip rather than crash — the
      // rule runs fully in any browser-capable job / local dev.
      return [
        {
          pass: true,
          message:
            'token-resolution-transparency: skipped — chromium browser not installed ' +
            '(`npx playwright install chromium`).',
        },
      ];
    }
    try {
      for (const theme of themes) {
        const themeCss = readFileSync(theme.cssFile, 'utf-8');
        for (const mode of ['dark', 'light'] as const) {
          for (const a of assertions) {
            const container = a.container ?? '--surface-card';
            const scopeClass = a.scopeClass ?? 'root';
            const tokensToProbe = ['--surface-page', container, a.token];

            const html = buildProbeHtml({
              tokensCss,
              themeCss,
              componentCss: a.componentCss,
              themeSlug: theme.slug,
              scopeClass,
              mode,
              tokens: tokensToProbe,
            });

            const context = await browser.newContext({ colorScheme: mode });
            const page = await context.newPage();
            let raw: Record<string, string>;
            try {
              await page.setContent(html, { waitUntil: 'load' });
              raw = (await page.evaluate(
                `(function () {
                  var out = {};
                  document.querySelectorAll('[data-token]').forEach(function (el) {
                    out[el.getAttribute('data-token')] = getComputedStyle(el).backgroundColor;
                  });
                  return out;
                })()`,
              )) as Record<string, string>;
            } finally {
              await context.close();
            }

            // Composite alpha surfaces: page over black → container over page → token over container.
            const pageParsed = parseRgba(raw['--surface-page'] ?? '');
            const pageRgb: Rgb = pageParsed ? composite(pageParsed, [0, 0, 0]) : [0, 0, 0];
            const containerParsed = parseRgba(raw[container] ?? '');
            if (!containerParsed) continue; // container token undefined in this theme — nothing to compare
            const containerRgb = composite(containerParsed, pageRgb);
            const tokenParsed = parseRgba(raw[a.token] ?? '');
            if (!tokenParsed) continue; // token undefined in this theme
            const tokenRgb = composite(tokenParsed, containerRgb);

            const verdict = evaluateIntent({ tokenRgb, containerRgb, intent: a.intent });
            const label = `${a.component} ${a.token} (${a.intent} on ${container}) · ${theme.slug} ${mode}`;

            if (verdict.pass) {
              results.push({ pass: true, message: `${label}: ✓` });
              continue;
            }

            if (isAllowlisted(allow, a.component, a.token, theme.slug, mode)) {
              results.push({
                pass: true,
                message: `${label}: inversion allowlisted (surfaceIntentAllow)`,
              });
              continue;
            }

            const wrongWay =
              a.intent === 'recessed'
                ? 'renders LIGHTER than its container (should be a recessed well)'
                : 'renders DARKER than its container (should read raised)';
            results.push({
              pass: false,
              message:
                `${label}: ${a.token} ${wrongWay} — ` +
                `token luminance ${verdict.tokenLum.toFixed(4)} vs container ${verdict.containerLum.toFixed(4)} ` +
                `(Δ ${verdict.delta.toFixed(4)}). The token name lied; the rendered value inverts the intent. ` +
                `If intentional, allowlist "${a.component}:${a.token}@${theme.slug}:${mode}" in .visorrc.json.`,
              file: `components/ui/${a.component}/${a.component}.module.css`,
            });
          }
        }
      }
    } finally {
      await browser.close();
    }

    return results;
  },
};
