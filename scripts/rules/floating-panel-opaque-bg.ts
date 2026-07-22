import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';
import type { Rule, RuleResult } from './types.js';

/**
 * floating-panel-opaque-bg (VI-209, rewritten VI-623).
 *
 * A floating / portaled panel (dialog, popover, dropdown, command palette, …)
 * floats over the dimmed backdrop with no opaque layer behind it, so its fill
 * MUST be opaque. `--surface-card` is a card-in-flow token a theme may make
 * translucent glass (blackout: `rgba(255,255,255,0.04)`); used as a floating
 * panel's primary fill it reads see-through. `--surface-popover` is the opaque
 * floating token (== `--surface-card` on solid themes).
 *
 * The original rule shipped with four coverage holes that let `dialog-form`
 * (VI-620) and `command-dialog` (VI-386) ship translucent anyway — see
 * docs/wisdom/W032. This rewrite closes them:
 *
 *   1. Scope — scans `blocks/**` as well as `components/**` (the offenders live
 *      in `blocks/`).
 *   2. Detection — a file is a floating panel when its sibling `.tsx` renders a
 *      portaled atom (STRUCTURAL, not a hand-maintained name allowlist that the
 *      next floating component gets forgotten from). Covers new floating blocks
 *      automatically.
 *   3. Property — matches the `background:` shorthand, not only `background-color:`.
 *   4. Primary token — flags only when `--surface-card` is the PRIMARY (first)
 *      background token. `var(--surface-elev, color-mix(… --surface-card …))`
 *      resolves to the opaque primary and is not a violation.
 *
 * The box-shadow gate is kept ON PURPOSE: it isolates the outermost, elevated
 * panel (which carries the shadow) from inner nested surfaces that are backed by
 * the already-opaque panel. An in-flow elevated card that is legitimately
 * card-surfaced (e.g. confirm-dialog's static `.inlineSurface`) opts out with an
 * inline "opaque-bg-exempt: <reason>" comment marker on or above the fill line.
 */

// Portaled-atom signals in a sibling .tsx. A component that renders one of these
// puts its surface over a backdrop. Radix portal primitives, the Visor atoms
// (by import path), and sonner (toast's portaled toaster).
const PORTAL_RADIX =
  /@radix-ui\/react-(dialog|popover|dropdown-menu|context-menu|menubar|hover-card|tooltip|select|toast)\b/;
const PORTAL_ATOM_PATH =
  /["'][^"']*\/(dialog|popover|dropdown-menu|context-menu|menubar|hover-card|tooltip|select|command)\/[a-z-]+["']/;
const SONNER_IMPORT = /from\s+["']sonner["']/;

export function isFloatingPanelSource(tsxSource: string): boolean {
  return (
    PORTAL_RADIX.test(tsxSource) ||
    PORTAL_ATOM_PATH.test(tsxSource) ||
    SONNER_IMPORT.test(tsxSource)
  );
}

// A background declaration whose PRIMARY (first) var() token is --surface-card.
const PRIMARY_SURFACE_CARD = /background(-color)?\s*:\s*var\(\s*--surface-card\b/;
const EXEMPT_MARKER = 'opaque-bg-exempt';

/**
 * Returns the 1-based line numbers where a floating panel fills its primary
 * background with a bare `--surface-card` inside a box-shadow'd (elevated) block
 * — i.e. the see-through-over-backdrop violations. Pure + fixture-testable.
 */
export function findFloatingBgViolations(css: string): number[] {
  const lines = css.split('\n');
  const violations: number[] = [];

  let depth = 0;
  let blockHasBoxShadow = false;
  let pending: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const openCount = (line.match(/\{/g) || []).length;
    const closeCount = (line.match(/\}/g) || []).length;

    if (openCount > 0 && depth === 0) {
      blockHasBoxShadow = false;
      pending = [];
    }

    depth += openCount;

    const trimmed = line.trimStart();
    const isComment =
      trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('//');

    if (depth >= 1 && !isComment) {
      if (/box-shadow\s*:/.test(line)) blockHasBoxShadow = true;

      const exempt =
        line.includes(EXEMPT_MARKER) ||
        (i > 0 && lines[i - 1].includes(EXEMPT_MARKER));

      if (
        PRIMARY_SURFACE_CARD.test(line) &&
        !line.includes('var(--surface-popover') &&
        !exempt
      ) {
        pending.push(i + 1);
      }
    }

    depth -= closeCount;

    if (depth === 0 && closeCount > 0 && blockHasBoxShadow) {
      violations.push(...pending);
      pending = [];
    }
  }

  return violations;
}

export const floatingPanelOpaqueBg: Rule = {
  name: 'floating-panel-opaque-bg',
  description:
    'Floating panels (dialog/popover/dropdown/command/…) must fill their background with an opaque surface (var(--surface-popover)), not a primary bare var(--surface-card) — surface-card may be translucent in glass themes like Blackout. Detection is structural (sibling .tsx renders a portaled atom); scans components/ and blocks/.',
  category: 'tokens',
  async run() {
    const results: RuleResult[] = [];

    for (const pattern of ['components/**/*.module.css', 'blocks/**/*.module.css']) {
      for await (const filePath of glob(pattern)) {
        if (filePath.endsWith('.d.ts')) continue;

        const name = basename(filePath).replace('.module.css', '');
        const tsxPath = join(dirname(filePath), `${name}.tsx`);
        if (!existsSync(tsxPath)) continue;

        const tsx = await readFile(tsxPath, 'utf-8');
        if (!isFloatingPanelSource(tsx)) continue;

        const css = await readFile(filePath, 'utf-8');
        for (const lineNum of findFloatingBgViolations(css)) {
          results.push({
            pass: false,
            message:
              'Floating panel fills its background with a primary var(--surface-card) — use var(--surface-popover, var(--surface-page, #ffffff)) so the panel is opaque over the backdrop in glass themes (Blackout, Modern Minimal). If this surface is in-flow (static-positioned, sits on the page), add a `/* opaque-bg-exempt: <reason> */` marker on or above the line.',
            file: filePath,
            line: lineNum,
          });
        }
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message:
          'All floating panels fill their background with an opaque surface (var(--surface-popover)/var(--surface-page)), not a bare var(--surface-card)',
      });
    }

    return results;
  },
};
