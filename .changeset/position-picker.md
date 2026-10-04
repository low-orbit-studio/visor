---
"@loworbitstudio/visor": minor
---

feat: add PositionPicker (VI-672), a 3x3 anchor grid

`npx visor add position-picker` ships nine targets in a grid, one chosen, the value a `{ y: 'top' | 'center' | 'bottom', x: 'left' | 'center' | 'right' }` pair. It is a radio group in two dimensions: arrow keys move in both axes (wrapping), `Home` and `End` jump to the ends, and each target is named ("Top left"). Controlled (`value`, `null` for none) or uncontrolled (`defaultValue`), with `onValueChange`.

`variant="on-image"` fills a positioned photograph frame with no ground of its own and gives every target its own scrim ring, so each keeps 3:1 over any photograph without a filter on the photo. Every target's hit area is at least 24x24 at every size; on a small thumbnail the grid grows to the target size rather than shrinking the targets. `renderTarget` swaps the drawn dot for a glyph, such as alignment icons in the occupied row. The standalone grid's resting edge reads the shared `--control-edge-*` tokens, so `--control-edge-width: 0` turns it off while focus survives.
