/**
 * Component-scoped token emission (VI-625).
 *
 * Renders the resolved `components:` block of a `.visor.yaml` as
 * `--<name>: <value>` custom properties. Light-mode bindings emit under the
 * light selector; dark-mode bindings under the manual-toggle selectors plus the
 * `prefers-color-scheme` media query — the same shape `brand-passthrough.ts`
 * uses for pass-through vars and `generateDarkCss` uses for adaptive tokens.
 *
 * Why `visor-adaptive` and not a new layer: component tokens are mode-aware,
 * exactly like the Tier-1 adaptive set, and nothing else in the cascade declares
 * these property names — so a new layer would buy no resolution power while
 * churning `LAYER_ORDER` (and therefore every generated theme file) fleet-wide.
 *
 * Emission is strictly opt-in. A theme with no `components:` block produces no
 * output here at all, which is what makes the VI-625 D4 invariant hold: an
 * unbound theme is byte-identical to a pre-VI-625 theme.
 */

import type { ResolvedComponentTokens } from "../component-tokens.js";
import type { ColorScheme } from "../types.js";

/** Selectors the emitted blocks attach to. Mirrors `PassthroughSelectors`. */
export interface ComponentTokenSelectors {
  /** Light-mode selector (e.g. `:root`, `html:not(.dark) .strata-theme`). */
  light: string;
  /** Manual-toggle dark selector(s), comma-joined. */
  dark: string;
  /** `prefers-color-scheme: dark` selector. */
  prefers: string;
}

function indentBlock(selector: string, decls: string[]): string {
  if (decls.length === 0) return "";
  return [selector + " {", ...decls.map((d) => `  ${d}`), "}"].join("\n");
}

function declsFor(values: Record<string, string>): string[] {
  return Object.keys(values)
    .sort()
    .map((name) => `--${name}: ${values[name]};`);
}

/**
 * Build the component-token CSS body (not wrapped in `@layer` — the caller
 * wraps). Returns "" when nothing is bound.
 */
export function generateComponentTokensCss(
  tokens: ResolvedComponentTokens,
  selectors: ComponentTokenSelectors,
  colorScheme: ColorScheme = "adaptive",
): string {
  const lightDecls = declsFor(tokens.light);
  const darkDecls = declsFor(tokens.dark);
  if (lightDecls.length === 0 && darkDecls.length === 0) return "";

  const blocks: string[] = [
    "/* ── Component tokens (VI-625) — theme bindings for the admin-UI families ── */",
  ];

  // BO-56: single-mode brands collapse onto the host selector with no
  // manual-toggle / prefers-color-scheme blocks.
  if (colorScheme === "dark-only") {
    blocks.push(indentBlock(selectors.light, darkDecls));
    return blocks.filter(Boolean).join("\n\n");
  }
  if (colorScheme === "light-only") {
    blocks.push(indentBlock(selectors.light, lightDecls));
    return blocks.filter(Boolean).join("\n\n");
  }

  if (lightDecls.length > 0) {
    blocks.push(indentBlock(selectors.light, lightDecls));
  }

  if (darkDecls.length > 0) {
    blocks.push(indentBlock(selectors.dark, darkDecls));
    const prefersInner = indentBlock(selectors.prefers, darkDecls)
      .split("\n")
      .map((l) => `  ${l}`)
      .join("\n");
    blocks.push(`@media (prefers-color-scheme: dark) {\n${prefersInner}\n}`);
  }

  return blocks.filter(Boolean).join("\n\n");
}
