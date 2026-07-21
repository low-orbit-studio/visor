---
"@loworbitstudio/visor": patch
---

VI-622: Fix `dialog-form` and `command-dialog` floating panels rendering see-through on glass themes.

Both blocks filled their portaled panels with `var(--surface-card)` — a card-in-flow surface a theme may legitimately make translucent glass (e.g. `blackout`: `rgba(255,255,255,0.04)`). A modal / command palette floats over the dimmed backdrop with no opaque layer behind it, so the translucent fill read straight through to the page. Swapped to `var(--surface-popover)` (the opaque floating-panel token, matching the Dialog atom's opacity intent) with an opaque `--surface-page` fallback:

- `dialog-form` — `.panel` background
- `command-dialog` — `.command` and `.list` backgrounds

On every solid theme `--surface-popover` resolves identically to `--surface-card` (e.g. neutral `#18181b`, space `#0e0e18`), so the panels are pixel-unchanged where they already rendered correctly; only the translucent glass-theme case is fixed.
