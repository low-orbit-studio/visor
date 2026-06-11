---
"@loworbitstudio/visor": minor
---

Add `--admin-list-page-table-header-radius` CSS hook to `admin-list-page` — pipes into the DataTable's `--data-table-sort-bar-radius` so consumers can set square top corners on the sort-bar (borderless flush-header pattern) without forking the block. Defaults to the DataTable's own default, keeping the existing rounded sort-bar unchanged.
