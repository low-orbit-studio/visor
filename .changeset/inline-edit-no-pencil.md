---
"@loworbitstudio/visor": minor
---

InlineEdit takes `pencil={false}` (VI-677). Without the pencil, the text is the control: a native `button` named "Edit {label}, {value}" that opens the field on click, Enter or Space, takes focus back after Enter or Escape, and underlines on hover and shows the focus ring alone on focus, clear of the glyphs (solid by default; a theme may set `--inline-edit-underline-style: dashed`). Its hit target is at least 24px tall. The default is unchanged, byte for byte.
