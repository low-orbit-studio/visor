---
"@loworbitstudio/visor": minor
---

RadioGroup takes `variant="card"` (VI-668). Each `RadioGroupItem` becomes a card with `icon`, `title` and `description` slots and a check mark; the chosen card is a lifted fill with a light inset edge, never white. A `disabled` item stays in place and readable, is skipped by the arrow keys, and says why through `aria-describedby` (announced after its description). The title names the item and the description describes it. Edges read the shared `--control-edge-*` tokens: the card and the default dot draw an inset outline over a transparent border, so `--control-edge-width: 0` removes them (an edgeless dot keeps a fill so it still reads as a control); focus and invalid survive. New overrides: `--radio-card-bg`, `--radio-card-selected-bg`, `--radio-card-selected-border`, `--radio-card-border`, `--radio-card-radius`, `--radio-card-icon-size`. The render harness gains `radio-group` fixtures (`default`, `card`).
