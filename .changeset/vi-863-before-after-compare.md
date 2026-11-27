---
"@loworbitstudio/visor": minor
---

`npx visor add before-after-compare` ships BeforeAfterCompare, a before/after capture pair for review surfaces. Four modes: Side by Side (top-aligned, stacking under 768px), Swipe (a clip-path divider that is a `role="slider"` the arrow keys move), Flip (an instant blink on click or Space) and Diff (a pixel diff in the browser, changed regions boxed, with a stat line). Keys 1 to 4 switch mode and Z toggles a synced 2.5x loupe; a faint crosshair follows the pointer on both images. In Side by Side and Diff a click drops a numbered mark at the same spot on both images (0 to 1 coordinates plus capture CSS pixels), and `markLine` writes it as `n. <label> at x X, y Y`. A capture under 600px wide draws at its CSS width, never scaled up, in a bezel concentric with its screen. The pixel engine is `capture-diff.ts`.
