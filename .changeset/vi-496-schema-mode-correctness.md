---
"@loworbitstudio/visor-theme-engine": patch
"@loworbitstudio/visor": patch
---

Four independent correctness fixes from the architecture audit: `visor-theme.schema.json` (both copies) now declares `label` and `default-mode` properties so themes using these fields pass JSON Schema linting; the docs adapter's `prefers-color-scheme: dark` media queries now use the correct triple-negation selector (`:not(.light):not(.theme-light):not([data-theme="light"])`) so the light-mode escape-hatch actually works; the private-theme generator threads `defaultMode` from the YAML `default-mode` field through `PrivateThemeEntry` so the switcher can force a theme's preferred color mode on activation; and `--primary-text` in the intent group is now a single-source alias of `var(--interactive-primary-text)` eliminating the duplicated constant while preserving per-theme overrides.
