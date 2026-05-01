---
"@loworbitstudio/visor": minor
---

Add `2xs` (11px) primitive font size and opt-in typography utility classes. `primitiveFontSizes` now generates `--font-size-2xs: 0.6875rem` in all CSS outputs. A new `generateUtilitiesCSS()` step writes `dist/utilities.css` with `.eyebrow` and `.label-tiny` utility classes, exposed via `@loworbitstudio/visor-core/utilities` in the package exports map. Consumers opt in with `import "@loworbitstudio/visor-core/utilities"`.
