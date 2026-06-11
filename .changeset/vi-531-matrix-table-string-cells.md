---
"@loworbitstudio/visor": minor
---

MatrixTable cells now accept `string` values alongside `boolean`.

Each row can carry an optional `cells` map of per-column `string | boolean` values (`MatrixCellValue`). A `true`/`false` entry renders the existing checkmark/empty indicator; a `string` entry renders as plain text in the standard cell style. A `cells` entry takes precedence over `activeColumns` for that column.

This makes the standard feature-comparison matrix (rows = features, columns = plans, cells = mixed `true`/`false`/`"50GB"`) work in one composition. Existing boolean-only callers using `activeColumns` are unchanged and render pixel-identical.
