---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor": minor
---

Badge ground and ink tokens (VI-661).

Every Badge variant now reads its background through `--badge-bg` and its label
colour through `--badge-ink`, each falling back to the value the variant already
shipped with. Set either on a badge or on any ancestor to tint one badge — an
accent tint, an on-image scrim — without a variant per tint, and without
overriding a shared semantic token such as `--surface-muted` that other
components in the same scope also read. With neither set, every variant renders
exactly as it did before.

Themes can bind both as `components.badge.bg` and `components.badge.ink`. No
border is added. StatusBadge renders a Badge, so a token set on an ancestor
reaches it too.

`visor render badge` gains one fixture per variant (`--fixture neutral`,
`--fixture filled-info`, …).
