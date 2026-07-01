---
"@loworbitstudio/visor-theme-engine": patch
---

Extractor now detects the source project's color-scheme and records it as the machine-readable `color-scheme` field on the generated config (BO-57), instead of losing the mode to a hand-written prose comment. A new `detectColorScheme()` helper resolves by priority: an explicit standard `color-scheme:` CSS declaration (excluding `--color-scheme` and `prefers-color-scheme`) wins over the dark-only-background heuristic, which wins over the `adaptive` default. `parseCSSDeclarations` stays scoped to custom properties. When an explicit declaration conflicts with the heuristic, the explicit value wins and an ambiguity warning is surfaced for the operator.
