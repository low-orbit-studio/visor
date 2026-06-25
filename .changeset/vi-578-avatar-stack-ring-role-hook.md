---
"@loworbitstudio/visor": minor
---

feat(avatar): AvatarStack ring-surface role hook + editorial overflow density

Absorbs the two consumer-side AvatarStack treatments that PL-1638 placed in the org build's overlay into canonical Visor, finishing the VI-545 doctrine (component-level editorial treatment lives on the density axis; consumers never style a component's `data-slot` internals):

- **`--avatar-stack-ring` role hook** — the disc ring now reads `var(--avatar-stack-ring, var(--surface-default, #ffffff))`. The default is byte-identical for existing consumers; a stack on a different surface tier sets one custom property on a wrapper (e.g. `--avatar-stack-ring: var(--surface-card)`) instead of reaching into `data-slot` internals.
- **Editorial overflow type** — under `data-density="editorial"` the `+N` overflow disc font drops to 11px so the count never clips in the smaller editorial disc, removing the need for the consumer's `--font-size-sm` hack. Default density is unchanged.
