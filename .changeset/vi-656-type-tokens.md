---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

Theme tokens for size, case and tracking on Field label, Button and Text, the Switch's dimensions, and a warning tone on Text (VI-656).

- **Field** — `components.field`: `label-font-size`, `label-text-transform`, `label-letter-spacing`, `label-color` (both densities).
- **Button** — `components.button`: `text-transform`, `letter-spacing`, `radius` for every size, plus `{sm,md,lg,dlg}-font-size`, `-text-transform`, `-letter-spacing`, `-radius` for one size.
- **Text** — `components.text`: `{xs,sm,md,lg,xl}-font-size`, `-text-transform`, `-letter-spacing`, and a new `color="warning"` that reads `--text-warning`.
- **Switch** — `components.switch`: `track-width`, `track-height`, `knob-inset` (the knob sits that far from the track's outer edge on every side), plus the existing `track-bg` and `edge-color` hooks, now in the contract.

Every hook defaults to what shipped before it existed, so an unbound theme renders unchanged. None draws an edge: the outline Button and the Switch track keep reading the shared `control` edge tokens, so `edges: off` still removes them.
