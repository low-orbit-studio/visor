---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor": minor
---

SegmentedControl size hooks (VI-785). Four new keys in the `segmented-control` family let a theme set the segment box: `item-height` (`--segmented-control-item-height`, the pill follows it), `track-padding` (`--segmented-control-track-padding`), `item-padding-x` (`--segmented-control-item-padding-x`) and `font-size` (`--segmented-control-font-size`). Each falls back to the chosen size's ToggleGroup value (xs 24px, sm 28px, md 36px, lg 44px), so a theme that binds none of them renders every size pixel-identical to before. Re-copy with `npx visor add segmented-control --overwrite`.
