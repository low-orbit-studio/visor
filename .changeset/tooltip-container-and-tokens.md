---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor": minor
---

Tooltip portal container and its own ground and ink tokens (VI-683).

`TooltipContent` takes an optional `container`, forwarded to the Radix Portal.
Pass the root of a class-scoped theme and the tooltip mounts inside it, so it
reads that theme's tokens instead of the page's. Unset, it portals to
`document.body` as before.

The tooltip now reads `--tooltip-bg` and `--tooltip-text`, falling back to
`--surface-overlay` and `--text-inverse`, so every existing theme renders
exactly as before. A dark theme, where both of those resolve dark, binds the
pair instead of retuning `--text-inverse` (the dark ink Calendar, Badge and Chip
read): as `components.tooltip.bg` / `components.tooltip.text`, or as a flat
`overrides.dark.tooltip-bg` / `tooltip-text` pass-through.
