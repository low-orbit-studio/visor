---
"@loworbitstudio/visor": minor
---

VI-432 feat: `color-picker` Visor primitive — first-class OKLCH color picker installable via `npx visor add color-picker`.

Ships a theme-agnostic OKLCH-based color picker that reuses the validated math from `@loworbitstudio/visor-theme-engine`. Two surfaces — `popover` and `inline` — both built on the same engine. Registered under the `form` category with a docs page (4 live previews), a locked design recipe + HiFi mockup under `design-prototypes/color-picker/`, and 33 passing tests including WCAG 2.1 AA axe coverage. The `isOutOfGamut` helper is kept as a stable seam for a future engine release that exposes unclamped linear RGB. Replaces the simple hex picker in the `prototype-review` block at the consumer's option (the simple picker stays as the sensible default; `ColorPicker` is a drop-in upgrade).
