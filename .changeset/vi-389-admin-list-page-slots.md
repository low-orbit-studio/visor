---
"@loworbitstudio/visor-core": minor
---

VI-389 feat: `admin-list-page` adds `customFilterBar` and `footerStatus` slots.

Two optional, additive slot props for the `admin-list-page` block:

1. **`customFilterBar?: ReactNode`** — replaces the default `<FilterBar>` entirely. When supplied, the block renders the supplied node inside the header region (wrapped in `data-slot="admin-list-page-custom-filter-bar"`) and ignores the FilterBar-specific props (`searchValue`, `onSearchChange`, `searchPlaceholder`, `filters`, `activeFilters`, `onClearFilters`, `resultsCount`). Mixing the custom bar with any of those props logs a dev-mode `console.warn`. `hideFilterBar` still wins over both default and custom bars. Unblocks editorial-density compositions (removable chip clusters, "Add filter" pills, trailing icon buttons) that the rigid FilterBar shape cannot express.

2. **`footerStatus?: ReactNode`** — always-on info row rendered below the table, inside the table section, wrapped in `data-slot="admin-list-page-footer-status"`. Independent of `BulkActionBar` (selection-gated, sticky/inline) — the two can coexist; `footerStatus` renders below `BulkActionBar` so the always-on info anchors the bottom of the table chrome. Typical content is a selection count, total, and Kbd hint cluster.

No breaking changes. Both new props default to `undefined`; render output is byte-for-byte identical for any consumer not using them.
