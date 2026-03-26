/**
 * CSS @layer utilities for adapter output.
 *
 * Establishes a specificity ordering so theme overrides work
 * without !important. Layers are adapter-only — the base
 * generateFullBundleCss output is not wrapped in layers.
 */

/** Layer order declaration — must appear before any @layer blocks. */
export const LAYER_ORDER =
  "@layer visor-primitives, visor-semantic, visor-adaptive, visor-bridge;";

/**
 * Wrap CSS content in a named @layer block.
 */
export function wrapInLayer(layerName: string, css: string): string {
  const trimmed = css.trim();
  if (!trimmed) return "";
  return `@layer ${layerName} {\n${trimmed}\n}`;
}
