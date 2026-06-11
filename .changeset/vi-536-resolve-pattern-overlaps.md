---
"@loworbitstudio/visor": minor
---

Resolve three composition-pattern overlaps so the set has one canonical pattern per archetype (15 → 11 patterns total, following the wizard-flow removal in VI-535).

- **Layout** — fold `responsive-sidebar-layout`'s mobile `Sheet`-drawer behavior into `dashboard-layout` (now responsive by default), then remove `responsive-sidebar-layout`.
- **Data table** — merge `crud-table`'s CRUD/record-management framing into the richer `data-table-row-actions` pattern and remove `crud-table`; keep `data-table-with-filters` as the distinct filtering concern, with the two survivors cross-linked.
- **Empty state** — remove the `empty-state` *pattern*; the shipped `empty-state` *component* is canonical (card-grid + search-results already demonstrate it in context). The component and its references are unchanged.

Consumers who already ran `npx visor add` for any removed pattern keep their copy (copy-and-own); these patterns are simply no longer offered by the registry. Pattern `name:` casing standardization is deferred to VI-537.
