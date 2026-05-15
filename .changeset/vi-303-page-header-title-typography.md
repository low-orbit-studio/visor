---
"@loworbitstudio/visor": minor
---

VI-303 feat: `PageHeader` exposes `titleSize` and `titleFamily` props for marquee-scale title typography.

Editorial admin surfaces hero a single page title at a much larger scale than the existing `size: "sm" | "md" | "lg"` axis allows (e.g., 56px display-font "Tonight"). `size` conflated three axes (gap rhythm, title size, description size); adding an `xl` variant would compound the conflation. This ticket follows the VI-288 `StatCard.valueAs` precedent and splits title typography off as its own orthogonal axis.

**New props (both optional, additive — no breaking changes):**

- `titleSize?: "default" | "marquee" | string` — Token presets map to `data-title-size` on the title slot. Any other string is forwarded as a raw CSS length on an inline `--page-header-title-size` declaration and rendered via the marquee rule.
- `titleFamily?: "heading" | "display" | string` — Token presets map to `data-title-family`. `"display"` resolves to `var(--font-display, var(--font-family-heading, inherit))` so themes without a display font degrade to the heading family.

**New CSS custom properties on `.base` (override hooks for themes):**

- `--page-header-title-size` — defaults to `3.5rem`. Used by `titleSize="marquee"`.
- `--page-header-title-family` — defaults to `var(--font-display, var(--font-family-heading, inherit))`. Used by `titleFamily="display"`.

When both props are omitted no `data-title-*` attributes are added and the rendered markup is byte-for-byte identical to the previous output. The `size` variant rules continue to drive the default sizing cascade.
