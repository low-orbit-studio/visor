---
"@loworbitstudio/visor-theme-engine": patch
"@loworbitstudio/visor-core": patch
---

Class-scoped themes from the docs adapter now resolve visor-core's semantic aliases against the theme's own tokens (VI-695). `--field-menu-bg`, `--chart-2` to `--chart-5`, `--weight-*`, `--size-*`, the motion and layout aliases and the rest are re-declared on `.{slug}-theme`, so they no longer inherit visor-core's `:root` default: on blacklight-app, Select, Combobox, DatePicker, DateRangePicker and TimePicker panels now use the theme's popover surface instead of navy. This matches what the nextjs adapter has done since VI-648. It applies to `visor theme apply --adapter docs` output, to visor-core's `dist/themes/*.css`, and to the theme CSS the docs site and `visor render` read.

Twelve aliases whose visor-core value changes in dark mode (`--sidebar-*`, `--border-input`, `--skeleton-from`/`-to`, `--chart-1`) are left inheriting visor-core's mode-correct value, since the alias table holds only their light referent. They are listed as `MODE_DEPENDENT_SEMANTIC_ALIASES` (new export) and pinned against the emitted `tokens.css`. `generateSemanticAliasDecls` takes an optional `{ skip }` set.
