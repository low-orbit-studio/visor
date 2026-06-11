---
"@loworbitstudio/visor": minor
---

Add `headerSize`, `titleSize`, `titleFamily`, and `leading` pass-through props to `AdminTabbedEditor`, forwarding straight to its internal `PageHeader` so consumers can tune editorial title scale per-recipe instead of forking the block.

Also adds a `leading` prop and matching `--page-header-title-leading` custom-property hook to `PageHeader` for tuning title line-height. All new props are optional and default-safe: omitting them keeps every existing call site pixel-identical.
