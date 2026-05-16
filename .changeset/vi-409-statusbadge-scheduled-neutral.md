---
"@loworbitstudio/visor": patch
---

VI-409 fix: StatusBadge `scheduled` tone maps to `neutral` (was `info`).

`STATUS_COLOR_GROUP["scheduled"]` flipped from `"info"` to `"neutral"` so the default `scheduled` rendering groups visually with `draft` under a muted treatment, matching the editorial admin baseline (admin-v7-r3). Previously rendered as a blue `info` pill, which conflicted with the typical event-status grouping where `live` is the active/colored signal and `scheduled` / `draft` are quieter.

Consumers passing `tone="info"` explicitly to StatusBadge are unaffected. Only the default mapping for the literal string `"scheduled"` changes.
