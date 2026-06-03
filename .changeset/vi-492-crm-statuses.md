---
"@loworbitstudio/visor": minor
---

Add CRM / pipeline statuses to `StatusBadge` (VI-492). The status vocabulary
gains seven first-class stages — `prospect` (info), `pitched` (warning),
`contracted` / `active` / `completed` (success), `paused` (warning), and
`archived` (neutral) — so CRM consumers get type-safe `<StatusBadge status={…} />`
instead of a hand-rolled status map. Each stage binds to an existing semantic
color group, so no new tokens are introduced.

Also adds a `filled-neutral` Badge variant — the saturated counterpart to the
subtle `neutral` variant (VI-456) — a solid `--color-neutral-600` fill with
white text and indicator dot. `StatusBadge` now renders neutral statuses
(`queued`, `idle`, `scheduled`, `draft`, `archived`) with `neutral` in subtle
tone and `filled-neutral` in filled tone, so they read legibly in both tones and
both modes (previously filled-neutral fell back to an invisible white-on-white
`secondary` chip in light mode). Also corrects the docs Status→Variant table,
which listed `scheduled` as `info` instead of its actual `neutral` group.
