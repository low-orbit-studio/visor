# @loworbitstudio/visor-core

## 0.7.0

### Minor Changes

- 177728b: VI-349 — Round-1 retrofit fixes for marketing-grade consumers.

  **Marquee** — Default `.item`/`.separator` line-height bumped from tight to normal so descenders (`g`, `y`, `p`, `q`, `j`) clear the band's overflow boundary at marketing-display sizes. Default `durationSec` bumped from 25 to 40 for a calmer scroll at display scale.

  **StationSpectrum** — Dropped the `.station:last-child` flex-end override that made dot 05 read as misaligned with 01–04. All dots now align flex-start within equal-width columns; the rail's right offset is computed from `--station-count` so the line terminates exactly at the last dot center for any `N` (verified at 3, 5, 7).

  **BentoTile (BREAKING)** — New `layout` prop with default `"stacked"`: media renders on top with its own aspect ratio, body is a sibling block below. `layout="overlay"` retains the previous body-over-media behavior. Consumers depending on the old default must pass `layout="overlay"` explicitly. Exposes `data-layout` for consumer styling hooks.

  **NameRoster** — Exposes 14 `--roster-*` CSS custom properties on `.roster` covering item typography (size, weight, letter-spacing, line-height), colors (default, hover, highlighted), dot (size, color, hover, highlighted, glow), and hover transform. Defaults resolve to the current visual output. The hardcoded `filter: brightness()` hover effect is replaced by `--roster-dot-color-hover`; consumers wanting a brightness shift use `color-mix()` against the token.

### Patch Changes

- 8f444af: Rebalance `SEMANTIC_TEXT_MAP` so the auto-derived text scale clears WCAG AA contrast by default for any reasonable input neutral. `text-secondary` now maps to neutral 700/300 (light/dark) and `text-tertiary` to neutral 600/400 — both fixed-L shades. Previously `text-tertiary` landed on neutral 400 (L 0.65), giving ~3.5:1 contrast on white and forcing every stock theme to override the entire text scale. `text-primary` (900/50) and `text-disabled` (300/600) are unchanged. Stock themes (`neutral`) drop their defensive text overrides; `modern-minimal`, `blackout`, and `space` keep theirs as intentional brand language. Borderless dark text-secondary contrast improves from 2.96:1 to 6.77:1.
- 0e6fce5: Extend `theme-text-contrast` regression rule (`scripts/rules/theme-text-contrast.ts`) to validate text-primary, text-secondary, and text-tertiary against surface-card, surface-muted, and surface-popover in addition to page background — 24 checks per theme (3 tokens × 4 surfaces × 2 modes). Surfaces with alpha (rgba) are alpha-composited over the resolved page background before the WCAG 2.1 ratio is computed; the existing `composite()` helper is reused. Catches the gray-on-gray / light-on-light failure mode that motivated this work (e.g., text-tertiary on surface-muted), which previously passed because only the page-bg pairing was checked. Stock theme YAMLs (`neutral`, `space`, `borderless`) gained narrow `surface-muted` overrides (and, for `borderless`, explicit text/surface overrides for both modes) so palette-derived elevated surfaces still clear AA. text-disabled and text-ghost remain exempt per WCAG 1.4.3.

## 0.6.0

### Minor Changes

- VI-312: Ship every `dist/*.css` file pre-wrapped in matching CSS `@layer` blocks (`visor-primitives`, `visor-semantic`, `visor-adaptive`) with a layer-order declaration prepended. Generated themes from `visor theme apply --adapter nextjs` now win the cascade against visor-core's defaults without consumer intervention. Unlayered consumer overrides written after `@import "@loworbitstudio/visor-core"` continue to win — the documented override pattern is unchanged.

## 0.5.0

### Minor Changes

- 7ec9229: Ship stock themes (blackout, modern-minimal, neutral, space) as npm subpath exports. Consumers can now `import '@loworbitstudio/visor-core/themes/blackout'` and apply the matching `.{slug}-theme` class.

## 0.4.1

### Patch Changes

- 84e3cb5: Document WCAG AA contrast ratios for text tokens and add migration note for consumers with local overrides.

## 0.2.0

### Minor Changes

- Initial release of Visor design tokens — CSS custom properties for primitives, semantic tokens, and light/dark themes.
