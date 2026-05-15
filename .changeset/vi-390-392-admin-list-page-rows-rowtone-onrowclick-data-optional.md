---
"@loworbitstudio/visor-core": minor
---

VI-390 + VI-392 feat: `admin-list-page` forwards DataTable `rows` / `rowTone` / `onRowClick` and makes `data` optional.

Three new optional pass-through props for the `admin-list-page` block plus one signature relaxation:

1. **`rows?: DataTableRow<TData>[]`** — discriminated-union row list (`{kind:"group"|"data"}`) forwarded as-is to DataTable. Lets the block carry interleaved group headers and data rows (e.g., "Tonight / This week / Later" sections) without dropping to bare data-table. When `rows` is supplied, `data` is ignored; dev-mode `console.warn` fires if both are passed. Also forwards an optional `groupRowRenderer?: (group: DataTableGroupRow) => ReactNode` for custom group cell content.

2. **`rowTone?: (row: TData) => DataTableRowTone | undefined`** — per-row semantic tone callback (live / warn / scheduled / sold / draft / danger / info) forwarded as-is to DataTable. Tones resolve to Visor surface tokens at the CSS layer for subtle background tinting.

3. **`onRowClick?: (row: TData) => void`** — per-row click handler forwarded as-is to DataTable. When supplied, every data row becomes a keyboard-activatable target (click + Enter/Space). Typical use: open a detail drawer for the clicked row.

4. **`data?: TData[]` is now optional** — the prop was previously required even when consumers supplied `rows` or rendered a custom table body. Defaults to `[]` when omitted, which yields DataTable's empty state.

No breaking changes. All new props default to `undefined`; existing consumers that pass `data` unchanged render byte-for-byte identical output.
