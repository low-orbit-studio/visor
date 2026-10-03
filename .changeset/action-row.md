---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

Add `ActionRow` and `ActionRowList` (`npx visor add action-row`): one tappable list row that is a `button`, or an `a` through `asChild`, with a leading slot, a title, an optional second line and a trailing value, badge or caret. The row is at least 44px tall and has rest, hover, focus-visible, selected, open and disabled states, each reading a token. `selected` sets `aria-current` (`aria-selected` on option, tab, row, gridcell and treeitem roles) and draws a lifted fill with an inset edge at `--control-state-edge-width` (the width focus and invalid use), so `edges: off` keeps it. `ActionRowList` stacks rows in a `ul` with a hairline between them on `--hairline-width`. The trailing slot is non-interactive: a focusable element in it fires a development-only `console.warn`.

The theme engine registers the `action-row` component-token family (`components.action-row.*`: `min-height`, `padding`, `gap`, `radius`, `hover-bg`, `open-bg`, `selected-bg`, `selected-edge-color`, `disabled-opacity`, `title-weight`, `line-color`, `leading-color`, `leading-size`, `trailing-color`) in the contract and both theme schemas, and `ActionRow` joins the `--hairline-width` consumers. Unbound themes render from the semantic surface ramp.
