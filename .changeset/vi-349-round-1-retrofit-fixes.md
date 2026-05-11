---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-core": minor
---

VI-349 — Round-1 retrofit fixes for marketing-grade consumers.

**Marquee** — Default `.item`/`.separator` line-height bumped from tight to normal so descenders (`g`, `y`, `p`, `q`, `j`) clear the band's overflow boundary at marketing-display sizes. Default `durationSec` bumped from 25 to 40 for a calmer scroll at display scale.

**StationSpectrum** — Dropped the `.station:last-child` flex-end override that made dot 05 read as misaligned with 01–04. All dots now align flex-start within equal-width columns; the rail's right offset is computed from `--station-count` so the line terminates exactly at the last dot center for any `N` (verified at 3, 5, 7).

**BentoTile (BREAKING)** — New `layout` prop with default `"stacked"`: media renders on top with its own aspect ratio, body is a sibling block below. `layout="overlay"` retains the previous body-over-media behavior. Consumers depending on the old default must pass `layout="overlay"` explicitly. Exposes `data-layout` for consumer styling hooks.

**NameRoster** — Exposes 14 `--roster-*` CSS custom properties on `.roster` covering item typography (size, weight, letter-spacing, line-height), colors (default, hover, highlighted), dot (size, color, hover, highlighted, glow), and hover transform. Defaults resolve to the current visual output. The hardcoded `filter: brightness()` hover effect is replaced by `--roster-dot-color-hover`; consumers wanting a brightness shift use `color-mix()` against the token.
