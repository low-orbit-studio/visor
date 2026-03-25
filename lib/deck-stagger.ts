import type { CSSProperties } from "react"

export type StaggerSystem = "text" | "card" | "hero" | "footer"

const STAGGER_BASE_MS: Record<StaggerSystem, number> = {
  text: 0,
  card: 200,
  hero: 100,
  footer: 300,
}

const STAGGER_STEP_MS: Record<StaggerSystem, number> = {
  text: 80,
  card: 100,
  hero: 120,
  footer: 100,
}

const MAX_CARD_INDEX = 9

/**
 * Returns inline style with a computed transitionDelay for stagger animations.
 * Apply alongside a CSS Module animation class (e.g., styles.fadeIn).
 */
export function staggerDelay(
  index: number,
  system: StaggerSystem = "text"
): CSSProperties {
  const effectiveIndex = system === "card"
    ? Math.min(index, MAX_CARD_INDEX)
    : index
  const delay = STAGGER_BASE_MS[system] + STAGGER_STEP_MS[system] * effectiveIndex
  return { transitionDelay: `${delay}ms` }
}
