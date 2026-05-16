---
"@loworbitstudio/visor": minor
---

VI-405 feat: `admin-list-page` exposes CSS hooks for table card boundary + footer styling.

Five new CSS custom properties make the table card + footer pill independently themable without forking the block CSS:

- `--admin-list-page-table-bg` (default `transparent`)
- `--admin-list-page-table-radius` (default `0`)
- `--admin-list-page-footer-bg` (default `transparent`)
- `--admin-list-page-footer-radius` (default `0`)
- `--admin-list-page-footer-padding` (default current `var(--spacing-3, 0.75rem) 0`)
- `--admin-list-page-footer-border-top` (default current `1px solid var(--border-subtle, …)`)

All defaults preserve current behavior. Pairs with VI-404 (which moved the footer to a sibling of the table section) — consumers wanting the standalone-pill treatment can now compose these hooks instead of overriding via `:global` selectors.
