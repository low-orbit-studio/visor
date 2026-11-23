/**
 * Concentric-corner check (VI-837), for any test runner.
 *
 * A control with a track and a selected item is concentric when the item's
 * radius is the track's radius minus the gap between them. The gap is measured
 * from the two bounding rects (top edges), not from `padding`, so borders,
 * insets and height calcs all count. Both radii are clamped to half their box
 * height, the radius the browser actually draws, so a 999px track around a
 * 996px item reads as pill in pill.
 *
 * Feed it `getBoundingClientRect()` plus the computed `border-top-left-radius`
 * of each element. It throws with the numbers when the corners do not nest.
 */

export interface ConcentricBox {
  /** Top edge in px (a bounding rect's `top` or `y`). */
  top: number
  /** Box height in px. */
  height: number
  /** Corner radius in px, or the computed value (`"8px"`). */
  radius: number | string
}

export interface ConcentricResult {
  gap: number
  outer: number
  inner: number
  expected: number
}

/** The drawn radius: the declared radius, clamped to half the box height. */
const drawn = (box: ConcentricBox): number => Math.min(parseFloat(String(box.radius)) || 0, box.height / 2)

/** Measure without asserting. */
export function measureConcentric(outer: ConcentricBox, inner: ConcentricBox): ConcentricResult {
  const gap = inner.top - outer.top
  const o = drawn(outer)
  return { gap, outer: o, inner: drawn(inner), expected: Math.max(0, o - gap) }
}

/** Assert inner = max(0, outer - gap), within `tolerance` px (default 0.5). */
export function expectConcentric(outer: ConcentricBox, inner: ConcentricBox, tolerance = 0.5): ConcentricResult {
  const r = measureConcentric(outer, inner)
  if (Math.abs(r.inner - r.expected) > tolerance) {
    throw new Error(
      `Corners are not concentric: outer radius ${r.outer}px, gap ${r.gap}px, so the inner radius should be ${r.expected}px, but it is ${r.inner}px.`,
    )
  }
  return r
}

// The page-wide scan (VI-838): every nested rounded pair on a page, for Playwright.
export { scanConcentric } from "./concentric-scan"
export type { ConcentricPair, ConcentricScanOptions, Corner } from "./concentric-scan"
