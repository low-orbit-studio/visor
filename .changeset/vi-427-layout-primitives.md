---
"@loworbitstudio/visor": minor
---

VI-427 feat: layout primitives — `Box`, `Stack`, `Inline`, `Grid`, `Container`.

Five token-driven layout primitives, each at `components/ui/{name}/`, available via `npx visor add box stack inline grid container`. Token-named props (`SpacingToken`, `SurfaceToken`, `RadiusToken`, `BorderToken`) are enforced by TypeScript so off-system values are compile errors. Responsive `{ base, sm, md, lg, xl }` maps are wired through per-breakpoint CSS variables. Stack defaults to `gap="md"`, Container defaults to `size="lg" padding="md"`. All primitives ref-forward and support `as` prop polymorphism, defaulting to `<div>`. Total bundle weight is 1.8 KB gzipped (target was &lt; 5 KB). 58 unit tests + 16 snapshot/token-coverage tests + 5 SSR tests; docs site has a new `components/layout` group with MDX pages and `PropsTable` API references.
