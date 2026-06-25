---
"@loworbitstudio/visor": minor
---

feat(skeleton): add content-shape-aware variants — SkeletonList, SkeletonTable, SkeletonDetail

Extends the Skeleton primitive with three compound loading-placeholder components that mirror real content shapes, eliminating layout reflow on data resolve. Per the VI-584 Borealis state-pattern spec:

- `SkeletonList` — list rows with avatar circle, two text lines, and a badge pill
- `SkeletonTable` — N×M grid of cell-width placeholders for data tables
- `SkeletonDetail` — large avatar block plus heading and body text lines for detail/profile panels

All three carry `role="status"` and `aria-label` for screen-reader accessibility. Internal shape helpers (line heights, avatar sizes, width utilities, layout classes) added to the CSS module. Shimmer animation and token references unchanged.
