---
"@loworbitstudio/visor": major
---

VI-399 BREAKING: `StatCard` `trend` slot defaults to footer position.

`<StatCard trend={…}>` now renders the trend as a direct child of the card root (after value/delta, before footer), full card width — NOT inside the header. The previous header-position layout, which collapsed thin Progress bars and competed with the label for header space, is opt-in via `trendPosition="header"`.

**Migration:** consumers wanting the prior layout pass `trendPosition="header"`. Consumers not using `trend` are byte-for-byte unchanged. New `data-trend-position={position}` attribute on the wrapper for CSS targeting; new `--stat-card-trend-padding-top` hook (default `var(--spacing-3)`) for tuning the gap above the trend.

This is the BIG default change — it visually shifts every existing StatCard consumer that uses the `trend` slot. Pairs with VI-398's hero-scale default change.
