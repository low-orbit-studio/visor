---
"@loworbitstudio/visor": patch
---

DataTable: expose `--data-table-sort-bar-radius` custom property hook on the thead sort-bar row (VI-532). Defaults to `var(--radius-lg)` so existing rounded-top-corner behavior is unchanged. Themes can set `--data-table-sort-bar-radius: 0` to get straight corners on the header row — the borderless-admin pattern.
