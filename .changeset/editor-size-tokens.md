---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

Theme keys for the control sizes Blacklight's editor draws visibly differently. Every key is a `components:` entry in `.visor.yaml`, and unset each renders exactly as before.

- **Button weight:** `button.font-weight` sets every size, `button.<size>-font-weight` one size (`dlg` ships at 600, the others at 500).
- **Input:** `input.md-height`, `md-padding` and `md-radius` make the md shape a theme key. Each falls back to the existing `--input-height-md` / `--input-padding-md` / `--input-radius-md`, so a scope that sets those still applies while the key is unbound; a bound key wins. DialogField's medium well follows `md-padding` and `md-radius`.
- **Textarea and Select (md):** `textarea.padding` and `radius`, and `select.height`, `padding` and `radius`.
- **TagInput:** a new `tag-input` family covers the field (`min-height`, `padding`, `radius`) and each held tag (`tag-height`, `tag-padding-x`, `tag-font-size`, `tag-font-weight`, `tag-radius`). The new `entryAs="slot"` prop types the next tag into a dashed slot the shape of a tag (`slot-height`, `slot-padding-x`, `slot-radius`, `slot-min-width`). The slot's edge is the shared drop edge (`--control-drop-edge-*`), so `edges: off` turns it off.
- **SaveStatus:** `save-status.font-size`, and a new `dot` prop that draws a status dot before the label in every state, in the state's ink. `dot-size` sets the dot, and the new `unsaved-dot-size` sets it while Unsaved (it follows `dot-size`, and it also sizes the `unsavedAs="dot"` dot). The label never moves.
- **Refused value:** `control.invalid-ring-width` and `control.invalid-halo-width` set the error ring and the soft halo outside it on Input, Textarea and Select. Neither reads `edge-width`, so invalid stays visible with edges off.
