---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

VI-655: one switch turns every form-control edge off.

Input, Textarea, Select, Checkbox, Switch, TagInput, Chip, FileUpload, EmptyState and the edged Button faces (outline, gated, dlg ghost) now draw their resting edge from one shared set of tokens, `--control-edge-width` / `-color` / `-style`, instead of from `border`. Set `--control-edge-width: 0` on any ancestor, or `edges: off` in a `.visor.yaml`, and every resting edge goes, dashed edges included.

- The edge is an `outline` pulled inside the box over a transparent geometry border, so flipping the switch never moves anything and no consumer needs a `border-color: transparent !important` override.
- Focus and invalid draw at `--control-state-edge-width`, which the switch does not touch, so both stay visible with edges off.
- With edges off, an unchecked Checkbox takes a fill (`--checkbox-edgeless-bg`) so it still reads as a box.
- Dashed edges (FileUpload, EmptyState) read `--control-drop-edge-width`, which follows the switch unless set on its own.
- Per-component colour overrides (`--input-border`, `--select-border`, `--tag-input-border`, …) still win over the shared colour.
- **Contract change:** `components.checkbox.border`, `components.chip.border` and `components.empty-state.border` (`--checkbox-border`, `--chip-border`, `--empty-state-border`) are now colour-only, like `--input-border`. Width and style always come from the shared edge, so an override can never push the inset edge outside the box. A binding like `"1px solid red"` becomes `"red"`. No stock or known consumer theme binds them.
- Theme engine: new top-level `edges: on | off` field and a `control` family in the VI-625 component-token contract (`components.control.*`), plus `checkbox.edgeless-bg`.
- `visor render` gains fixtures for every governed component.

With no token set, components render as before: geometry, fills, text and straight edges are unchanged, and only the anti-aliasing of rounded corners and dash ends differs by a few levels.
