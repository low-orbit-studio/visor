---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor": minor
---

VI-824: Button's outline face gets its own hooks, so a theme can draw the Honcho kit's outline squircle button. New `components.button` keys `outline-bg` (resting fill), `outline-padding`, `outline-font-weight`, `outline-ring-color` and `outline-backdrop-filter` (so it can frost over a photo like the glass icon button) set the outline variant alone, over the size and family padding, weight and the shared control edge. Unbound, the outline renders exactly as before.
