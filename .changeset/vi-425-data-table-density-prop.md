---
"@loworbitstudio/visor": minor
---

VI-425 feat: `data-table` `density` prop — `compact` / `default` / `editorial` row padding.

Adds an optional `density` prop to `data-table` (default `"default"`) that maps to a `data-density` attribute on the root and drives a `--dt-row-py` custom property the cells consume. `compact` = 8px, `default` = 12px (unchanged from previous behaviour — no visual regression for existing consumers), `editorial` = 20px (generous, each row reads as a card). Implementation only overrides cell `padding-top` / `padding-bottom` via a scoped `.root td` rule, leaving the existing `TableCell` shorthand to govern horizontal padding. Themes can override per-density values by targeting `[data-density="…"]` from their own selector. Driven by the `organization-management` pattern build (PL-1490 / PL-1498) where the editorial direction calls for more vertical breathing room than the default density allows.
