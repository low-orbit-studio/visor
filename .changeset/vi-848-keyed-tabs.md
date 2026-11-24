---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

Add `TabsList variant="keyed"`: a wrapping row of 36px tabs with one highlight (a 1px key-colour edge over a 10% key fill) that slides in x and y to the active tab over 450ms. It re-measures on resize, font load and when tabs are added, removed or reordered, and jumps under `prefers-reduced-motion`. Resting labels sit at 55% ink (80% on hover, full when active); a leading 16px icon sits at 45% and takes the key colour when active. Extra children after the label render inside the trigger. `size="compact"` narrows the side padding to 10px. Four new `tabs` component tokens skin it: `keyed-key`, `keyed-fill`, `keyed-ink`, `keyed-radius` (`--tabs-keyed-*`). `npx visor add tabs`.
