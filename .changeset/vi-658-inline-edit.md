---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": patch
---

New component: `InlineEdit` (VI-658), inline-editable text. It shows the text, then a pencil. A click or Enter turns it into an input in place, at the same size, so nothing moves.

- **Commit and cancel.** Enter, blur and Tab commit the trimmed text through `onCommit`, and only when it changed. Escape restores the text.
- **Defaults.** While `value` is empty, `defaultValue` shows, muted (`--text-tertiary`). Committing an empty string brings the default back.
- **Typography from `as`.** `as` sets the element (`span`, `p`, `h1`–`h6`…), and the type comes with it, so a section title renames at its own heading size.
- **Edges.** At rest, no edge. While editing, the input draws the shared `control` edge, so `edges: off` removes it. Focus keeps its own ring.
- **The pencil is the icon Button's mark.** It reads `button.icon-size`, `icon-pad` (its hit target, which adds no line height) and `icon-ghost-color`, so the engine's component-token contract now lists InlineEdit as a consumer of those three tokens.
