---
"@loworbitstudio/visor": patch
---

Fix stale `PageHeader` `leading`-prop docstring: it claimed the leading slot top-aligns (VI-539), but the CSS centers it — the VI-539 top-align was superseded by the VI-545 admin-editorial reconcile. Comment-only; no behavior or API change.
