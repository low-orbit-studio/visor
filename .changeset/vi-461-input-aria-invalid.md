---
"@loworbitstudio/visor": minor
---

Upgrade `<Input>`'s `[aria-invalid="true"]` styling (VI-461). The quiet outset
border-color swap is replaced with an inset 1.5px destructive border
(`box-shadow: inset … var(--border-error)`), a tinted background
(`--surface-error-subtle` with a `color-mix` fallback), and a destructive-tinted
focus halo on `[aria-invalid="true"]:focus-visible` (the neutral focus halo is
suppressed when invalid). No prop/API changes; consumers not passing `aria-invalid`
are unaffected, and `className`-supplied invalid styles still win the cascade.
