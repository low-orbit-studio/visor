/**
 * extract-typography-slots.mjs
 *
 * Pure helper extracted from generate-private-themes.mjs so it can be unit
 * tested in isolation. Takes a resolved theme config (the `themeData.config`
 * returned by @loworbitstudio/visor-theme-engine's `generateThemeData`) and
 * returns a serializable typography manifest for the docs site's
 * PRIVATE_THEMES entry. VI-356.
 *
 * Behavior:
 *   - Only slots that declare `weights` in their YAML are emitted. Empty
 *     weights arrays are dropped.
 *   - Weights are de-duplicated and sorted ascending — YAML order is not
 *     stable, and the specimen renders rows in numeric order anyway.
 *   - Returns `undefined` when no slot has weights, so callers can elide the
 *     `typography` field from the manifest entry entirely.
 */
export function extractTypographySlots(config) {
  const typography = config?.typography
  if (!typography) return undefined

  const out = {}
  for (const slot of ["heading", "display", "body", "mono"]) {
    const slotData = typography[slot]
    if (!slotData) continue
    if (!Array.isArray(slotData.weights) || slotData.weights.length === 0) continue
    const weights = [...new Set(slotData.weights)]
      .filter((w) => typeof w === "number" && Number.isFinite(w))
      .sort((a, b) => a - b)
    if (weights.length === 0) continue
    out[slot] = {
      family: String(slotData.family ?? ""),
      weights,
    }
  }

  return Object.keys(out).length > 0 ? out : undefined
}
