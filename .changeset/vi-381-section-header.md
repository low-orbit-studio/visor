---
"visor": minor
---

VI-381 feat: add `SectionHeader` primitive — compact section-divider with uppercase title and optional right-aligned meta.

New `components/ui/section-header/` primitive that fills the gap between `PageHeader` (page-level hero) and `Heading` (in-content h2/h3). 36px row with `--surface-subtle` background, 11px uppercase title at 0.14em letter-spacing, optional 13px tabular-num meta slot — sized for stacking 3-8 sections inside a page body.

Props: `title: React.ReactNode` (required), `meta?: React.ReactNode` (optional, right-aligned), `as?: "header" | "div" | "section"` (default `"header"`). Title renders as `<span>` so the primitive intentionally adds no heading semantics — wrap your own heading element in the title slot if you need a real h2/h3. Root carries `data-slot="section-header"`; sub-slots `section-header-title` and `section-header-meta`.

Registered in `registry/registry-ui.ts` so `npx visor add section-header` resolves. Docs proxy + MDX page added under `navigation`. Tokens used: `--surface-subtle`, `--text-tertiary`, `--font-size-xs`, `--font-size-sm`, `--font-weight-medium`, `--spacing-3`, `--spacing-4` — fully theme-portable.
