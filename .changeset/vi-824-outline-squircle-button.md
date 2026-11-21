---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor": minor
---

VI-824: Button's outline face gets its own hooks, so a theme can draw the Honcho kit's outline squircle button. New `components.button` keys `outline-bg` (resting fill), `outline-padding`, `outline-font-weight` and `outline-ring-color` set the outline variant alone, over the size and family padding, weight and the shared control edge. Unbound, the outline renders exactly as before.
