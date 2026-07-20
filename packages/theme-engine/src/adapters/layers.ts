/**
 * CSS @layer utilities for adapter output.
 *
 * Establishes a specificity ordering so theme overrides work without
 * !important. Both adapter output (here) and visor-core's emitted CSS
 * (packages/tokens/src/generate/generate-css.ts) declare this same layer
 * order — defense in depth, so whichever stylesheet loads first establishes
 * the cascade.
 */

/**
 * Layer order declaration — must appear before any @layer blocks.
 *
 * `visor-base` (VI-616) is FIRST — i.e. lowest priority. It carries the
 * element-level baseline (token-to-page binding + UA reset). Lowest placement
 * means a consumer's own unlayered `body {}` always wins, and component
 * `.module.css` (which uses no `@layer` at all) beats the base layer
 * unconditionally. Author-origin still beats the UA stylesheet regardless of
 * layer, so the reset does its job.
 *
 * `visor-brand` (VI-470) is ordered immediately after `visor-semantic`: brand
 * asset vars (`--brand-*`) sit above semantic tokens so brand overrides stay
 * cleanly separable, while still below `visor-adaptive` chrome and the
 * `visor-bridge` framework layer.
 */
export const LAYER_ORDER =
  "@layer visor-base, visor-primitives, visor-semantic, visor-brand, visor-adaptive, visor-bridge;";

/**
 * Wrap CSS content in a named @layer block.
 */
export function wrapInLayer(layerName: string, css: string): string {
  const trimmed = css.trim();
  if (!trimmed) return "";
  return `@layer ${layerName} {\n${trimmed}\n}`;
}
