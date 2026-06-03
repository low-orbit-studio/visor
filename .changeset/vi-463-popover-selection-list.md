---
"@loworbitstudio/visor": minor
---

Add `PopoverSelectionList` + `PopoverSelectionItem` + `PopoverSelectionLabel` compound to Popover (VI-463).

New exports provide WAI-ARIA listbox semantics, roving-tabindex keyboard navigation (Arrow Up/Down, Home/End, Enter/Space, Esc), and checkbox/radio indicator plates for single- and multi-select filter-control patterns inside a Popover. The `mode="checkbox" | "radio"` prop defaults to `"checkbox"` and propagates via context. Items support `selected`, `onSelect`, `disabled`, `count`, and `leadingIcon` props. All existing Popover exports are unaffected.
