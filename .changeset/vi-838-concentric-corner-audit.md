---
"@loworbitstudio/visor": patch
"@loworbitstudio/visor-core": minor
---

**Nested corners are concentric across the catalog (VI-838).** Tabs triggers and the ThemeSwitcher's end segment now sit the same distance from the track's end as from its top. The SegmentedControl / ToggleGroup sliding indicator is placed from fractional rects (it was up to 1px off one end) and follows its items when they resize, for example when web fonts land. The contract Meter's track is now a pill, with the bar inset 9px all round as a pill inside it (radius derived from the track). BillingSlider's colour layers clip to the rail's rounded ends. Menu items in Select, TimePicker, DropdownMenu, ContextMenu, Menubar and Combobox take the menu radius minus its padding (Select and TimePicker go from 2px to 4px on the default theme), and Menubar triggers fill the bar's height. Re-copy with `npx visor add tabs theme-switcher toggle-group segmented-control meter billing-slider select time-picker dropdown-menu context-menu menubar combobox --overwrite`.

`@loworbitstudio/visor-core/test-utils` now exports `scanConcentric`, which finds every rounded box drawn inside another on a page (open shadow roots included) and checks inner = outer − gap with an even gap on both axes. Run it with `page.evaluate(scanConcentric, { root: "main" })`.
