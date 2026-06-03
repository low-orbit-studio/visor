---
"@loworbitstudio/visor": minor
---

Add `neutral` Badge variant using `surface-muted` background + secondary text + transparent border (VI-456). Closes the gap in the tone vocabulary for Pending / Draft / Idle / Queued patterns in admin UIs.

**StatusBadge subtle-mode shift:** `SUBTLE_VARIANT.neutral` now maps to `"neutral"` instead of `"secondary"`. Consumers using `<StatusBadge status="draft|queued|idle|scheduled" />` will see `surface-muted` surface instead of the secondary surface. This is an intentional improvement — the existing `secondary` fallback was a documented workaround ("No filled-secondary exists — neutral statuses fall back to secondary"). `FILLED_VARIANT.neutral` continues to fall back to `secondary` per VI-456 D6.
