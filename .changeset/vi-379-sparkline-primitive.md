---
"visor": minor
---

VI-379 feat: add `Sparkline` primitive — decorative inline SVG mini-trend chart.

New `components/ui/sparkline/` primitive for the stat-card trend slot and dense data contexts. Renders a single SVG polyline from a numeric series with zero dependencies (no Recharts, no charting library). Default dimensions 96×22, stroke from `var(--accent-primary)` for theme portability. Returns `null` when `values.length < 2`.

Props: `values: number[]` (required, min 2), `width` (default 96), `height` (default 22), `color` (default `var(--accent-primary)`), `strokeWidth` (default 1.5). Decorative (`aria-hidden="true"`) by default; pass `aria-label` to promote to a labeled image.

Registered in `registry/registry-ui.ts` so `npx visor add sparkline` resolves. Docs proxy + MDX page added under `data-display`.
