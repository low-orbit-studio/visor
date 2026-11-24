---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

Add ScrollHint and useKeepGoing for long forms. ScrollHint is a "More Below" pill pinned to a scroll box's bottom edge while there is more to scroll; render it as the box's last child. `useKeepGoing(boxRef, pending)` returns `more`, `below` (a pending field sits below the fold, so the main button can read "Keep Going") and `go()`, which scrolls the next pending field a fifth of the way down the box and focuses it on a fine pointer. The pill is a solid chip by default and turns to the page colour at 70% with the glass layer's control blur inside `data-glass="on"`. It shows and hides in CSS, with no animation dependency. The new `scroll-hint` component-token family (`bg`, `border`, `color`, `glass-bg`, `gap`) skins it. `visor render` fixtures can now set `element` to mount a hook-driven part. `npx visor add scroll-hint`.
