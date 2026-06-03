---
"@loworbitstudio/visor": minor
---

ConfirmDialog (VI-460): add tinted severity icon plate + `"destructive"` prop alias.

**Visual change:** The severity icon is now rendered inside a ~2.5rem tinted circular
plate (`--surface-{info|warning|error}-subtle` background, `--text-{info|warning|error}`
icon color) stacked above the dialog title, replacing the previous bare 1.25rem inline
glyph. This is a visible change for all current ConfirmDialog consumers.

**API addition:** `ConfirmDialogSeverity` now accepts `"destructive"` as the canonical
high-severity value, aligning with `<Alert>` and `<Button>`. The existing `"danger"`
value is still accepted but is JSDoc-deprecated and will be removed in the next major
version. Internally, `"danger"` normalizes to `"destructive"` — all rendering logic,
`data-severity`, and button variant flow through a single branch.
