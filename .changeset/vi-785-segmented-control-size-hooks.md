---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor": minor
---

SegmentedControl size hooks (VI-785). Six new keys in the `segmented-control` family let a theme set the segment box and corners: `item-height` (`--segmented-control-item-height`, the pill follows it), `track-padding` (`--segmented-control-track-padding`), `item-padding-x` (`--segmented-control-item-padding-x`) `font-size` (`--segmented-control-font-size`), `item-radius` (`--segmented-control-item-radius`, the hover fill and focus ring) and `indicator-radius` (`--segmented-control-indicator-radius`, the pill; bind `999px` with `radius` for a fully round switch). Each falls back to the chosen size's ToggleGroup value (height xs 24px, sm 28px, md 36px, lg 44px), so a theme that binds none of them renders every size pixel-identical to before. Re-copy with `npx visor add segmented-control --overwrite`.
