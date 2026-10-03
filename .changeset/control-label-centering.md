---
"@loworbitstudio/visor": patch
---

Toggle Group, Tabs, Chip, Badge, Select and Input now centre their label's capitals in any font, using the mechanism Button got in VI-682 (spec: `docs/label-centering.md`). Bare text in a toggle-group item, tab trigger, chip or badge is wrapped in a block span (`toggle-group-text`, `tabs-trigger-text`, `chip-text`, `badge-text`) trimmed to the capital-height band, and the Select trigger's value span is trimmed the same way; Input trims its own inner line box. Measured on pixels, every control and size lands within 0.25px in Arial, Product Sans and PP Model Mono (Input at md is held to 0.5px: its inner line box snaps to whole pixels). Box sizes are unchanged. Browsers without `text-box` (Firefox) keep the previous rendering. Badge, Tabs and Select expose `--label-box-height` for the Blink baseline correction; re-bind it alongside a re-bound `--badge-md-padding` or `--tabs-list-height`.

The render harness measurement helper scans a label's own extent, clears corner radii, and places cases on integer positions.
