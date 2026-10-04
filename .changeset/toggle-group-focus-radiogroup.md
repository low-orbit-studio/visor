---
"@loworbitstudio/visor": minor
---

ToggleGroup shows a visible keyboard focus ring and exposes the right role (VI-690). `.item:focus-visible` now draws a solid `--border-focus` outline at `--focus-ring-width`, offset by `--focus-ring-offset`, replacing the 15% halo that measured 1.4:1 on dark planes (WCAG 2.4.7). A single-select ToggleGroup renders `role="radiogroup"` so its radio items have a radiogroup parent (WCAG 4.1.2); multi-select stays a `group` of pressed buttons. SegmentedControl inherits both.
