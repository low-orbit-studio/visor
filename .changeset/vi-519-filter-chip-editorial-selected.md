---
"@loworbitstudio/visor": minor
---

Add `selectedTreatment` prop to `FilterChip` for editorial/neutral-elevated selected state.

The new `selectedTreatment="neutral"` option renders selected chips with a neutral-elevated surface (`--surface-card` bg, `--border-strong` border, `--text-primary` text) instead of the default accent tint. When a count pill is present and the chip is selected, it renders as a solid mint pill (`--surface-success-default`). This prevents accent-token bleed in admin/editorial contexts (e.g. organisation-management filter bands) where the accent tokens are shared across multiple uses.

Default behaviour (`selectedTreatment="accent"`, or the prop omitted) is unchanged.
