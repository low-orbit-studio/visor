---
"@loworbitstudio/visor": minor
---

VI-400 feat: Sparkline gains a `fluid` prop that drops the SVG `width` attribute so the chart fills its container.

When `fluid={true}`, the rendered `<svg>` omits its `width` attribute (the `viewBox` preserves the aspect ratio), keeps the `height` attribute, and applies a `.svgFluid` class that forces `width: 100%; height: auto; display: block;` via CSS. When `fluid={false}` (default), the component is byte-for-byte unchanged — 96px × 22px SVG. Cleans up the common consumer pattern of forcing `width: 100%` via CSS overrides.
