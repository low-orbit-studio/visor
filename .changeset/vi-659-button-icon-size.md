---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

Button gets an icon-only size, `size="icon"` (VI-659): a square mark around one glyph — the glyph plus a hit-target pad on every side, so width always equals height.

- **Tokens** — `components.button`: `icon-size` (glyph, 1rem), `icon-pad` (hit-target pad, `--spacing-2`), `icon-radius`, and `icon-ghost-color` (ghost ink at rest, secondary; hover comes up to primary).
- **Accessible name** — an icon-only button renders no text, so it warns in development when it has no `aria-label` or `aria-labelledby`.
- **Edges** — ghost draws no edge; the outline face uses the shared `control` edge, so `edges: off` removes it.
