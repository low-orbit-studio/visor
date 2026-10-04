import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  generateThemeData,
  VISOR_CORE_DARK_SEMANTIC_ALIASES,
  VISOR_CORE_SEMANTIC_ALIASES,
} from '@loworbitstudio/visor-theme-engine';
import { docsAdapter, nextjsAdapter } from '@loworbitstudio/visor-theme-engine/adapters';
import { resolveTokensCssFile } from '../../packages/cli/src/commands/render.js';
import type { Rule, RuleResult } from './types.js';

/**
 * scoped-theme-alias-resolution (VI-648) — "the alias never saw the theme" check.
 *
 * Every semantic alias visor-core emits as `--X: var(--Y)` must, on a
 * `scopePrefix` theme, compute to the same value as `--Y` — the theme's own
 * primitive — and not to visor-core's `:root` default.
 *
 * Why a real browser and not a string comparison: custom-property substitution
 * resolves **where the property is declared**, and only a rendering engine
 * models that. The bug this rule guards is invisible to every text-level check
 * — `tokens.css` and the theme CSS are both individually correct, and the
 * defect only exists in how the two cascade. Same methodology as
 * `token-resolution-transparency` (W-111): `getComputedStyle`, never a regex
 * CSS engine.
 *
 * The defect it reproduces (measured on `blackout` + `--scope-prefix body.x`
 * before the fix):
 *
 * ```
 * --weight-heading  600  (theme declares 700)
 * --chart-1         #3b82f6  (stock blue on a monochrome theme)
 * --skeleton-from   #f3f4f6  (light gray on a dark theme)
 * ```
 *
 * Each theme is probed in light mode and in dark mode, the latter both through
 * the manual toggle (`html.dark` + `body.dark`) and through
 * `prefers-color-scheme: dark`. In dark mode the twelve mode-dependent aliases
 * (`--sidebar-*`, `--border-input`, `--skeleton-*`, `--chart-1`) must follow
 * their *dark* referent: before VI-696 the nextjs adapter pinned them to the
 * light one, so a scoped dark sidebar resolved to the theme's near-white
 * `--color-neutral-50`.
 *
 * Paired with `semantic-alias-coverage` in packages/tokens: that test proves
 * the alias *table* is complete against emitted `tokens.css`; this proves the
 * emitted CSS actually resolves. Neither implies the other.
 */

const SCOPE_CLASS = 'visor-alias-probe';
const SCOPE_PREFIX = `body.${SCOPE_CLASS}`;

interface ProbePage {
  setContent(html: string, opts: { waitUntil: 'load' }): Promise<void>;
  emulateMedia(opts: { colorScheme: 'light' | 'dark' }): Promise<void>;
  evaluate(expression: string): Promise<unknown>;
}
interface ProbeBrowser {
  newPage(): Promise<ProbePage>;
  close(): Promise<void>;
}
interface PlaywrightModule {
  chromium?: { launch(): Promise<ProbeBrowser> };
}

async function loadPlaywright(): Promise<PlaywrightModule | null> {
  for (const mod of ['playwright', '@playwright/test']) {
    try {
      return (await import(mod)) as PlaywrightModule;
    } catch {
      /* try next */
    }
  }
  return null;
}

/** Stock theme sources at the repo root. */
function discoverThemeSources(cwd: string): { slug: string; file: string }[] {
  const dir = resolve(cwd, 'themes');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.visor.yaml'))
    .map((f) => ({ slug: f.replace('.visor.yaml', ''), file: join(dir, f) }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * Probe every alias and its referent in one page. Both are read off the same
 * element, so a mismatch means the alias resolved somewhere the theme's value
 * was not visible.
 */
const PROBE = `(() => {
  const s = getComputedStyle(document.body);
  const out = {};
  for (const [alias, ref] of PAIRS) {
    out[alias] = [s.getPropertyValue('--' + alias).trim(), s.getPropertyValue('--' + ref).trim()];
  }
  return out;
})()`;

export const scopedThemeAliasResolution: Rule = {
  name: 'scoped-theme-alias-resolution',
  description:
    'Every visor-core semantic alias resolves to the theme\'s own primitive on a scopePrefix theme, ' +
    'not to visor-core\'s :root default (real-browser getComputedStyle) — catches the VI-648 class where ' +
    'a theme is silently ignored because the alias is substituted at :root.',
  category: 'tokens',
  async run(): Promise<RuleResult[]> {
    const cwd = process.cwd();
    const results: RuleResult[] = [];

    const playwright = await loadPlaywright();
    if (!playwright?.chromium) {
      return [{
        pass: true,
        message:
          'scoped-theme-alias-resolution: skipped — Playwright/chromium not installed ' +
          '(install with `npm i -D playwright && npx playwright install chromium`).',
      }];
    }

    const themes = discoverThemeSources(cwd);
    if (themes.length === 0) {
      return [{ pass: true, message: 'scoped-theme-alias-resolution: no themes/ sources found — skipped.' }];
    }

    const tokensCssFile = resolveTokensCssFile(cwd);
    if (!tokensCssFile || !existsSync(tokensCssFile)) {
      return [{
        pass: true,
        message:
          'scoped-theme-alias-resolution: skipped — packages/tokens/dist/tokens.css not built ' +
          '(run `npm run build -w packages/tokens`).',
      }];
    }
    const tokensCss = readFileSync(tokensCssFile, 'utf-8');

    const lightPairs = Object.entries(VISOR_CORE_SEMANTIC_ALIASES);
    const darkPairs = Object.entries({ ...VISOR_CORE_SEMANTIC_ALIASES, ...VISOR_CORE_DARK_SEMANTIC_ALIASES });
    // Light mode, then dark via the manual toggle, then dark via the OS
    // preference alone. The toggle goes where each adapter's dark selector
    // looks for it — see `toggleClass` below.
    const modes = [
      { label: 'light', dark: false, toggle: false, scheme: 'light' },
      { label: 'dark (manual toggle)', dark: true, toggle: true, scheme: 'light' },
      { label: 'dark (prefers-color-scheme)', dark: true, toggle: false, scheme: 'dark' },
    ] as const;

    let browser: ProbeBrowser | undefined;
    try {
      browser = await playwright.chromium.launch();
    } catch {
      return [{
        pass: true,
        message: 'scoped-theme-alias-resolution: skipped — chromium binary not installed.',
      }];
    }

    try {
      const page = await browser.newPage();
      for (const theme of themes) {
        // Both scoped emitters: the nextjs adapter (`scopePrefix`, VI-648) and
        // the docs adapter, whose `.{slug}-theme` output also ships as
        // visor-core's `dist/themes/*.css` and feeds the render harness (VI-695).
        // `toggleClass` is the manual dark toggle as each adapter expects it:
        // `html.dark` for the docs adapter's `.dark .{slug}-theme`; the body too
        // for nextjs's `body.x.dark`. A `.dark` body also matches visor-core's
        // own `.dark` rule, which then resolves the mode-dependent aliases on
        // the body by itself — so for nextjs only the prefers-color-scheme
        // probe can see a wrong dark mapping. Docs keeps `.dark` off the body,
        // as the docs site does, so its toggle probe has no such rescue.
        let variants: { label: string; css: string; bodyClass: string; toggleClass: { html: string; body: string } }[];
        let colorScheme: string;
        try {
          const data = generateThemeData(readFileSync(theme.file, 'utf-8'));
          colorScheme = data.config['color-scheme'] ?? 'adaptive';
          variants = [
            { label: SCOPE_PREFIX, css: nextjsAdapter(data, { scopePrefix: SCOPE_PREFIX }), bodyClass: SCOPE_CLASS, toggleClass: { html: 'dark', body: ' dark' } },
            { label: 'docs adapter', css: docsAdapter(data, { includeFontImports: false }), bodyClass: `${theme.slug}-theme`, toggleClass: { html: 'dark', body: '' } },
          ];
        } catch (err) {
          results.push({
            pass: false,
            message: `${theme.slug}: could not generate scoped CSS — ${(err as Error).message}`,
            file: theme.file,
          });
          continue;
        }

        for (const variant of variants) {
          for (const mode of modes) {
            // A single-mode theme renders its one palette whatever the page asks for.
            const dark = colorScheme === 'dark-only' || (colorScheme === 'adaptive' && mode.dark);
            const pairs = dark ? darkPairs : lightPairs;
            await page.emulateMedia({ colorScheme: mode.scheme });
            await page.setContent(
              `<!doctype html><html class="${mode.toggle ? variant.toggleClass.html : ''}"><head><meta charset="utf-8" />` +
              `<style>${tokensCss}</style><style>${variant.css}</style></head>` +
              `<body class="${variant.bodyClass}${mode.toggle ? variant.toggleClass.body : ''}"></body></html>`,
              { waitUntil: 'load' },
            );
            const values = (await page.evaluate(PROBE.replace('PAIRS', JSON.stringify(pairs)))) as Record<string, [string, string]>;

            const drifted: string[] = [];
            for (const [alias, referent] of pairs) {
              const [aliasValue, referentValue] = values[alias] ?? ['', ''];
              // An empty referent means this theme does not declare it, so the
              // alias is correctly left inheriting visor-core's default.
              if (referentValue === '') continue;
              if (aliasValue !== referentValue) {
                drifted.push(`--${alias} = ${aliasValue || '(empty)'} but --${referent} = ${referentValue}`);
              }
            }

            results.push({
              pass: drifted.length === 0,
              message: drifted.length === 0
                ? `${theme.slug}: all ${pairs.length} aliases resolve to the theme on ${variant.label}, ${mode.label}`
                : `${theme.slug}: ${drifted.length} alias(es) ignored the theme on ${variant.label}, ${mode.label} — ` +
                  `resolved against visor-core's :root default or the other mode's referent instead:\n    ${drifted.join('\n    ')}`,
              file: theme.file,
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
