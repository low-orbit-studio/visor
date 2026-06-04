---
"@loworbitstudio/visor": minor
---

activity-feed: add `compact-3col` variant for `[time][dot][text]` row layout

Adds `variant="compact-3col"` to `<ActivityFeed>` and surfaces timestamp in a dedicated left column (`grid-template-columns: var(--af-time-col, auto) 16px 1fr`). Default variant is unchanged — strict backwards compatibility.
