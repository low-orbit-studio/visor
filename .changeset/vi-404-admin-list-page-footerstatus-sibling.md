---
"@loworbitstudio/visor": major
---

VI-404 BREAKING: `AdminListPage` `footerStatus` now renders as a sibling of the table section, not a child.

The `footerStatus` slot moves from inside `<section data-slot="admin-list-page-table">` to a top-level child of the block root. This makes the footer float below the table card on the page background — matching the editorial admin baseline.

**Migration:** consumers targeting `[data-slot="admin-list-page-footer-status"]` directly keep working. Consumers using descendant selectors of the form `[data-slot="admin-list-page-table"] [data-slot="admin-list-page-footer-status"]` will silently stop matching — drop the `admin-list-page-table` ancestor.

Pairs with VI-405 (CSS hooks for the freshly-extracted footer node).
