---
"@loworbitstudio/visor": minor
---

Profile Menu takes `trigger="avatar"` for a top bar's account menu: the round avatar alone, ringed in the theme's key colour (`--primary`) on hover and while open, opening downward and aligned to the end, with the name and email in the menu header. The avatar menu renders in place beside its trigger and draws on Popover's skin: the `popover` hooks (corners, inset, fill, shadow, row fill) and, inside `data-glass="on"`, the glass layer's fill, lift, blur, shadow and ink; on a plain page it stays solid with no blur. Its rows sit softly in the panel with a gap between them. Profile Menu also takes `defaultOpen`. `DropdownMenuContent` gains an optional `container`, the element it portals into (default: the end of the page). The default `"row"` trigger is unchanged.
