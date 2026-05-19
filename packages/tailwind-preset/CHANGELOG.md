# @loworbitstudio/visor-tailwind-preset

## 0.2.0

### Minor Changes

- 3170bf9: VI-426 feat: net-new `@loworbitstudio/visor-tailwind-preset` package — a Tailwind preset that wires every Visor design token (primitives + semantic + adaptive, plus spacing, type scale, radii, shadows, opacity, z-index, and semantic motion duration/easing) into Tailwind theme keys as `var(--token)` references.

  Ships both a Tailwind 3 preset (default JS export — `presets: [require("@loworbitstudio/visor-tailwind-preset")]`) and a Tailwind 4 `@theme` sibling export (CSS string + `dist/v4.css` for direct `@import`). Consumer apps stop re-declaring hex values, spacing scales, or motion tokens in their `tailwind.config.ts`; Visor token updates propagate automatically via `npm update`. Per-theme overrides flow through the CSS variable layer at runtime — the preset stays fully theme-agnostic.
