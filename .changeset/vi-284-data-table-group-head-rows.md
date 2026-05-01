---
"@loworbitstudio/visor": minor
---

Add native support for interspersed group-header rows in `DataTable`. Callers pass a flat mixed array via the new optional `rows` prop — `{ kind: "group" }` items interspersed with data items — and `DataTable` renders group rows full-width (`colSpan={colCount}`) in the table body, skipping them in sort, selection, and pagination logic. New `DataTableGroupRow`, `DataTableDataRow<TData>`, and `DataTableRow<TData>` discriminated-union types; new optional `groupRowRenderer` slot for custom rendering. Default group-head styling uses Visor semantic tokens with sticky positioning. Purely additive — existing `data`-only consumers reach the unchanged code path.
