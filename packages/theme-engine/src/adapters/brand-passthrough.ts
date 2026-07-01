/**
 * Brand pass-through emission (VI-493).
 *
 * Renders unrecognized `overrides` keys (collected by `collectBrandPassthrough`)
 * as bare `--<key>` custom properties inside `@layer visor-brand`. Light-mode
 * keys emit under the light selector; dark-mode keys under the dark selectors +
 * `prefers-color-scheme` media query — matching the adaptive-token toggle pattern.
 *
 * Fail-loud (D3): a value that resolves to no value (empty / whitespace) is a
 * configuration error — in dev builds it renders as a bright sentinel color
 * (`#ff00ff`) so the gap is instantly visible, and the block is prefixed with a
 * sentinel comment naming every pass-through token. The operator directive: a
 * missing value must never be silently wrong.
 */

import type { BrandPassthrough } from "../overrides.js";
import type { ColorScheme } from "../types.js";

/** Bright magenta — unmistakable in dev when a pass-through value is missing. */
const SENTINEL_COLOR = "#ff00ff";

/** Dev-build detection. Build-time (Node) context — production suppresses the loud signals. */
function isDevBuild(): boolean {
  return process.env.NODE_ENV !== "production";
}

/** A pass-through value resolves to "no value" when it is missing or whitespace-only. */
function isUnresolved(value: string): boolean {
  return typeof value !== "string" || value.trim().length === 0;
}

/** Render one `--key: value;` declaration, sentinel-coloring unresolved values in dev. */
function declFor(key: string, value: string): string {
  if (isUnresolved(value)) {
    if (isDevBuild()) {
      return `--${key}: ${SENTINEL_COLOR}; /* [visor-brand] UNRESOLVED pass-through value */`;
    }
    return `--${key}: ${value};`;
  }
  return `--${key}: ${value};`;
}

function indentBlock(selector: string, decls: string[]): string {
  if (decls.length === 0) return "";
  return [selector + " {", ...decls.map((d) => `  ${d}`), "}"].join("\n");
}

export interface PassthroughSelectors {
  /** Selector for light-mode pass-through vars (e.g. `:root`, `html:not(.dark) .strata-theme`). */
  light: string;
  /** Manual-toggle dark selector(s), comma-joined (e.g. `.dark, .theme-dark`). */
  dark: string;
  /** `prefers-color-scheme: dark` selector (e.g. `:root:not(.light)`, `.strata-theme:not(.light)`). */
  prefers: string;
}

/**
 * Build the `visor-brand` pass-through CSS body (not wrapped in `@layer` — the
 * caller wraps or appends). Returns "" when there are no pass-through tokens.
 */
export function generateBrandPassthroughCss(
  passthrough: BrandPassthrough,
  selectors: PassthroughSelectors,
  colorScheme: ColorScheme = "adaptive",
): string {
  const lightKeys = Object.keys(passthrough.light);
  const darkKeys = Object.keys(passthrough.dark);
  if (lightKeys.length === 0 && darkKeys.length === 0) return "";

  const blocks: string[] = [];

  // Fail-loud sentinel comment (dev only): name every pass-through token so a
  // missing per-theme value is instantly traceable.
  if (isDevBuild()) {
    const names = [...new Set([...lightKeys, ...darkKeys])]
      .map((k) => `--${k}`)
      .join(", ");
    const count = lightKeys.length + darkKeys.length;
    blocks.push(`/* [visor-brand] ${count} passthrough: ${names} */`);
  }

  // BO-56: single-mode brands collapse onto the host selector (`selectors.light`)
  // with no manual-toggle / `prefers-color-scheme` blocks. `dark-only` keeps the
  // dark-mode values; `light-only` keeps the light-mode values.
  if (colorScheme === "dark-only") {
    if (darkKeys.length > 0) {
      const decls = darkKeys.map((k) => declFor(k, passthrough.dark[k]));
      blocks.push(indentBlock(selectors.light, decls));
    }
    return blocks.filter(Boolean).join("\n\n");
  }
  if (colorScheme === "light-only") {
    if (lightKeys.length > 0) {
      const decls = lightKeys.map((k) => declFor(k, passthrough.light[k]));
      blocks.push(indentBlock(selectors.light, decls));
    }
    return blocks.filter(Boolean).join("\n\n");
  }

  if (lightKeys.length > 0) {
    const decls = lightKeys.map((k) => declFor(k, passthrough.light[k]));
    blocks.push(indentBlock(selectors.light, decls));
  }

  if (darkKeys.length > 0) {
    const decls = darkKeys.map((k) => declFor(k, passthrough.dark[k]));
    blocks.push(indentBlock(selectors.dark, decls));
    const prefersInner = indentBlock(selectors.prefers, decls)
      .split("\n")
      .map((l) => `  ${l}`)
      .join("\n");
    blocks.push(`@media (prefers-color-scheme: dark) {\n${prefersInner}\n}`);
  }

  return blocks.filter(Boolean).join("\n\n");
}
