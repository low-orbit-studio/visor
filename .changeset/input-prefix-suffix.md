---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

Input and NumberInput take `prefix` and `suffix` (VI-662): fixed text inside the field, in the same well as the value, in the secondary text colour. The value never runs under an affix at any length, clicking an affix focuses the input, and the affix is wired to the input with `aria-describedby` so it is described, not announced as the value. The native HTML `prefix` attribute is omitted from the props type and not forwarded; with an affix, `className` lands on the wrapper that draws the well. The well keeps its one edge on the shared `--control-edge-*` tokens, so `--control-edge-width: 0` turns it off; NumberInput's edge now reads those tokens too instead of a `border`. New theme-contract tokens `--input-affix-gap` and `--input-affix-color` (`components.input-affix.gap` / `color`). New render fixtures: `input` `prefix` / `suffix` / `both`, and `number-input` `default` / `prefix` / `suffix`.
