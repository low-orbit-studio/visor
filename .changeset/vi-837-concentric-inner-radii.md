---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": patch
"@loworbitstudio/visor-core": minor
---

**Visual change to defaults.** Nested corners are now concentric by default. In SegmentedControl, the ToggleGroup `outline` track, the default Tabs list and ThemeSwitcher, the selected item's radius (the item, the sliding indicator, the hover fill and the focus ring) is now worked out in CSS as the track radius minus the track's padding and border. A theme can no longer let the two drift apart. On the default theme, SegmentedControl and outline ToggleGroup items go from 6px to 3px at sm and md, from 8px to 7px at lg and from 4px to 3px at xs. Tabs triggers are now pills inside the pill list. ThemeSwitcher is still a pill inside a pill. A theme that binds only `--segmented-control-radius` (or `--tabs-list-radius`) gets matching inner corners. `--segmented-control-radius: 999px` on its own now gives a round switch.

`--segmented-control-item-radius`, `--segmented-control-indicator-radius`, `--toggle-group-xs-item-radius` and `--tabs-trigger-radius` still work as explicit overrides. Leave them unset to get the derived radius. The default ToggleGroup variant (no track) and the line Tabs variant are unchanged. `@loworbitstudio/visor-core/test-utils` exports `expectConcentric(outer, inner)` and `measureConcentric`. They measure the gap from the bounding rects and check inner = max(0, outer − gap) to within 0.5px. Re-copy with `npx visor add segmented-control toggle-group tabs theme-switcher --overwrite`.
