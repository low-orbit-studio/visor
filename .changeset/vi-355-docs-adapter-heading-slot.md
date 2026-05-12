---
"@loworbitstudio/visor-theme-engine": minor
---

VI-355 fix: respect `typography.heading.family` in the docs adapter.

The docs adapter previously hard-aliased `--font-heading: var(--font-sans);`, silently overriding the theme's heading slot. Every other adapter (`generate-css.ts`, `adapters/deck.ts`, `fonts/pipeline.ts`) already read from `config.typography.heading.family`; the docs adapter — the one operators actually visually verify themes against — was the lone outlier. Themes like Blacklight that intentionally pair a display family for headings with a different body family rendered the wrong font in the docs Typography specimen as a result.

The docs adapter now emits `--font-heading` from `config.typography.heading.family` (falling back to `body.family` when no heading slot is defined), routed through the same alias-aware `fontStack()` helper used elsewhere so VI-354's per-theme `@font-face` aliasing still applies. Themes without an explicit heading slot keep the previous behavior because the engine's defaults resolve heading and body to the same family.
