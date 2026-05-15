---
"@loworbitstudio/visor-core": minor
---

VI-387 feat: `admin-dashboard` `layout="split"` mode with `mainCol` + `sideCol` slots.

Adds an additive 2-column body layout to the `admin-dashboard` block. The existing single-column flow (PageHeader → stat grid → optional `secondaryRegion` → activity feed) is preserved as `layout="single"` and remains the default — every current consumer renders byte-for-byte unchanged.

When `layout="split"` is set, the block renders a 2-column body grid below the KPI strip: `mainCol` (left, primary content) and `sideCol` (right rail). The caller composes both columns — the default activity feed and `secondaryRegion` are not rendered in split mode (a dev-only `console.warn` fires if either is supplied alongside `layout="split"`).

Two tunable CSS custom properties on the block root let themes retune the layout without touching block internals:

- `--admin-dashboard-side-col-width` (default `320px`) — right-rail width
- `--admin-dashboard-stack-bp` (default `960px`) — container-query breakpoint at which `sideCol` stacks below `mainCol`

The body element exposes `data-layout="split"` for downstream styling hooks; columns expose `data-slot="admin-dashboard-main-col"` / `data-slot="admin-dashboard-side-col"`. No breaking changes — `mainCol` and `sideCol` are optional and only consulted when `layout="split"`.
