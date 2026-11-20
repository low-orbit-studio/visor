---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

Popover takes skin hooks, reads the glass layer and can stay mounted. With `forceMount` on `PopoverContent`, the panel renders in place after its trigger and never unmounts: it fades in and out with a small rise (no rise under reduced motion), is `inert` while closed so the keyboard and screen readers skip it, leaves focus on the trigger when it opens and returns focus to the trigger on close when focus was inside it. The caller places it with its own class. The theme engine gains a `popover` family: `radius`, `padding`, `bg`, `shadow`, `duration`, `easing` and `rise`, each falling back to the look Popover drew before, so an unbound theme renders as it did. Inside `data-glass="on"` an in-place panel takes the glass layer's fill, lift, blur, shadow and ink (a bound `bg` or `shadow` still wins); elsewhere it stays solid with no blur. A Popover without `forceMount` still portals, unmounts on close and moves focus into the panel as before.
