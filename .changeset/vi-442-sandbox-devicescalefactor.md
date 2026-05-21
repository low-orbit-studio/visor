---
"@loworbitstudio/visor": patch
---

VI-442 fix(sandbox): the auto-generated `playwright.capture.mjs` now sets `deviceScaleFactor: 2` so retina captures look crisp on review.

File size cost is roughly 4x but PNGs stay in the low-megabyte range. Pixel-diff is unaffected (compares per-pixel either way).
