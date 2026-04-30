/**
 * CSS @layer utilities for adapter output.
 *
 * Establishes a specificity ordering so theme overrides work without
 * !important. Both adapter output (here) and visor-core's emitted CSS
 * (packages/tokens/src/generate/generate-css.ts) declare this same layer
 * order — defense in depth, so whichever stylesheet loads first establishes
 * the cascade.
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
