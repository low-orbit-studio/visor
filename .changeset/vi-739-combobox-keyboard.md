---
"@loworbitstudio/visor": minor
---

VI-739: the Combobox works from the keyboard.

- Typing highlights the first match; Arrow Down opens the list and moves the highlight down, Arrow Up moves it up, Home/End jump to the ends (no wrap), disabled options are skipped, and the highlighted option scrolls into view.
- Enter picks the highlighted option, Escape closes the list (a second Escape clears the text), Tab picks nothing.
- Focus stays in the input: it carries `aria-activedescendant`, and each `ComboboxItem` gets a stable `id` plus `data-highlighted` while highlighted. Mouse hover moves the same highlight.
