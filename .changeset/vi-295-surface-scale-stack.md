---
"@loworbitstudio/visor": minor
---

Add `surface-scale-stack` — a multi-tier stacked surface aggregator block that composes ordered `SurfaceRow` specimens into a rounded vertical stack with an optional use-note column.

Eliminates the per-consumer wrapper CSS required every time a full surface scale (page → screen → panel → panel-2 → panel-3) is documented. The note column renders only when at least one surface item provides a `note`, satisfying the V7-style use-note label pattern without coupling that data to the `SurfaceRow` primitive.
