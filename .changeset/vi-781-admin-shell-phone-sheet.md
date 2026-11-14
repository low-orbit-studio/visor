---
"@loworbitstudio/visor": minor
---

AdminShell (VI-781): below 48rem the sidebar is hidden and the main column takes the full width. A menu button at the start of the topbar (44px, `aria-expanded`, `aria-controls`) opens the sidebar as a sheet from the left, over a blurred `--overlay-bg` scrim. Esc, a scrim tap and a tap on any link in the sheet close it, and so does widening past 48rem. Focus moves into the sheet and stays there, and returns to the menu button on close. The page behind is `inert` and does not scroll. The slide is off under reduced motion. With `hideTopbar`, a phone still gets a bar holding only the menu button. Desk width and the icon rail are unchanged. Re-copy with `npx visor add --block admin-shell --overwrite`.
