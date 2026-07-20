import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { NATIVE_TO_VISOR, INPUT_TYPE_MAP } from '../../packages/cli/src/check/native-map.js';
import type { Rule, RuleResult } from './types.js';

/**
 * VI-616 — element defaults are owned by `@layer visor-base`.
 *
 * visor-core now ships two halves of an element baseline:
 *   • ORIGINATION — the nextjs adapter binds `--font-body`, `--text-primary`
 *     and `--surface-page` to `body` inside `@layer visor-base`.
 *   • PROPAGATION — `@loworbitstudio/visor-core/reset` declares
 *     `input, textarea, select, button, optgroup { font: inherit; }` plus
 *     box-sizing, UA margin and appearance normalisation.
 *
 * Once both ship, a component `.module.css` re-declaring any of that is
 * redundant. Worse, the re-declarations have already drifted into three
 * mutually-inconsistent variants (`font-family: inherit`, `font: inherit`,
 * and non-inherit values), which is exactly what a component-layer fix
 * cannot prevent — components are copy-and-own, so the fix never propagates.
 *
 * This rule asserts nobody re-declares what visor-base owns. Its OUTPUT is
 * the sweep list — do not hand-enumerate components (see D7 / VI-510, which
 * hand-enumerated nine components and left ~20 controls unpatched while the
 * patched ones drifted).
 */

/**
 * Font tokens that `visor-base` binds to `body`.
 *
 * A component may still *assert* the body font deliberately (e.g. `Text`
 * inside a display-font container), so these declarations are not banned —
 * but their fallback must be `inherit`, never a hardcoded UI stack. The token
 * always resolves once a theme is applied; when it doesn't, inheriting from
 * the `visor-base`-bound `body` is the correct answer, and a hardcoded
 * `system-ui` silently defeats the whole binding.
 */
const BODY_FONT_TOKENS = ['--font-body', '--font-sans', '--font-family-sans'];

/** Hardcoded UI-font fallbacks that must not appear behind a body-font token. */
const BANNED_FALLBACKS = [
  'system-ui',
  'ui-sans-serif',
  '-apple-system',
  'BlinkMacSystemFont',
  'Segoe UI',
];

/**
 * Component names that render a native control, derived from the CLI's
 * `native-map` — the existing source of truth for "which Visor component
 * stands in for which native element". Adding an entry there extends this
 * rule's coverage for free; the rule holds no path list of its own.
 */
export function nativeControlComponentNames(): Set<string> {
  const names = new Set<string>();
  for (const mapping of Object.values(NATIVE_TO_VISOR)) names.add(mapping.visorName);
  for (const mapping of Object.values(INPUT_TYPE_MAP)) names.add(mapping.visorName);
  return names;
}

/** `components/ui/input/input.module.css` → `input`. */
function componentNameFor(filePath: string): string {
  const segments = filePath.split('/');
  return segments[segments.length - 2] ?? '';
}

/** Strip `/* … *\/` comments so commented-out examples don't trip the matchers. */
function stripComments(content: string): string {
  return content.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    match.replace(/[^\n]/g, ' '),
  );
}

/**
 * Scan one stylesheet for declarations `@layer visor-base` now owns.
 *
 * Exported so tests can exercise the matchers against inline fixtures — the
 * rule globs the real tree, and writing throwaway components into
 * `components/` would race the other rules that glob the same paths.
 */
export function findOwnedDeclarations(
  content: string,
  filePath: string,
  isNativeControl: boolean,
): RuleResult[] {
  const results: RuleResult[] = [];
  const lines = stripComments(content).split('\n');

  // Track the selector that opened the current declaration block so
  // native-control checks can key on the element they target.
  let currentSelector = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const selectorMatch = line.match(/^([^{}]+)\{/);
    if (selectorMatch) currentSelector = selectorMatch[1].trim();

    const decl = line.match(
      /^\s*(font|font-family|appearance|-webkit-appearance)\s*:\s*([^;]+);/,
    );
    if (!decl) continue;

    const [, property, rawValue] = decl;
    const value = rawValue.trim();

    // (1) Bare inherit — the reported bug, now provided by the reset.
    if ((property === 'font' || property === 'font-family') && value === 'inherit') {
      results.push({
        pass: false,
        message: `\`${property}: inherit\` is owned by @layer visor-base — delete it and import "@loworbitstudio/visor-core/reset"`,
        file: filePath,
        line: i + 1,
      });
      continue;
    }

    if (property === 'font-family') {
      // (2) A body/sans token carrying a hardcoded UI-font fallback.
      // visor-base binds these tokens on `body`, so the only correct
      // fallback is `inherit` — a literal `system-ui` stack silently
      // defeats the binding and reintroduces the drift this layer
      // exists to end. The canonical form is `var(--font-body, inherit)`.
      const bodyToken = BODY_FONT_TOKENS.find((token) =>
        value.includes(`var(${token}`),
      );
      const bannedFallback = BANNED_FALLBACKS.find((font) => value.includes(font));
      if (bodyToken && bannedFallback) {
        results.push({
          pass: false,
          message: `\`var(${bodyToken}, …)\` falls back to \`${bannedFallback}\` — @layer visor-base binds this token on \`body\`, so the fallback must be \`inherit\``,
          file: filePath,
          line: i + 1,
        });
        continue;
      }

      // (3) Hardcoded stack with no token. Every deliberate non-inherit
      // font must route through a token (e.g. `var(--font-mono)`).
      if (!value.includes('var(')) {
        results.push({
          pass: false,
          message: `hardcoded font stack \`${value}\` — route deliberate non-inherit fonts through a token (e.g. var(--font-mono))`,
          file: filePath,
          line: i + 1,
        });
        continue;
      }
    }

    // (4) Native-control components only: search/number appearance
    // normalisation is owned by the reset. Coverage here is derived
    // from NATIVE_TO_VISOR + INPUT_TYPE_MAP, not a path list.
    if (
      isNativeControl &&
      (property === 'appearance' || property === '-webkit-appearance') &&
      value === 'none' &&
      /input\[type=["']?(search|number)["']?\]/.test(currentSelector)
    ) {
      results.push({
        pass: false,
        message: `\`${property}: none\` on ${currentSelector} is owned by @layer visor-base — delete it`,
        file: filePath,
        line: i + 1,
      });
    }
  }

  return results;
}

export const elementDefaultsOwnedByBase: Rule = {
  name: 'element-defaults-owned-by-base',
  description:
    'Component CSS must not re-declare element defaults owned by @layer visor-base (VI-616)',
  category: 'components',
  async run() {
    const results: RuleResult[] = [];
    const nativeControls = nativeControlComponentNames();

    const patterns = ['components/**/*.module.css', 'blocks/**/*.module.css'];
    const seen = new Set<string>();

    for (const pattern of patterns) {
      for await (const filePath of glob(pattern)) {
        if (seen.has(filePath)) continue;
        seen.add(filePath);

        const raw = await readFile(filePath, 'utf-8');
        const isNativeControl = nativeControls.has(componentNameFor(filePath));
        results.push(...findOwnedDeclarations(raw, filePath, isNativeControl));
      }
    }

    if (results.length === 0) {
      results.push({
        pass: true,
        message: `No component CSS re-declares element defaults owned by @layer visor-base (${seen.size} files, ${nativeControls.size} native-control components tracked)`,
      });
    }

    return results;
  },
};
