---
"@loworbitstudio/visor": patch
---

VI-406 fix: `data-table` group rows are non-hoverable by default.

Group rows (`data-slot="data-table-group-row"`) are visual separators, not interactive — but the underlying `table` primitive's `tr.row:hover` rule was leaking onto them. This change does two things in coordination:

- `components/ui/data-table/data-table.module.css` — `.groupRow` explicitly sets `background-color: transparent; cursor: default;` and overrides `:hover` to the same.
- `components/ui/table/table.module.css` — `tr.row:hover` narrows to `tr.row:not([data-slot="data-table-group-row"]):hover` so the rule no longer applies to group rows.

Data-row hover is byte-for-byte unchanged. Consumers no longer need `!important` overrides to suppress hover on group rows.
