---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

KeyValueList takes skin hooks and reads the glass layer. The theme engine gains a `key-value-list` family: label `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-transform`, `color` and `padding-top`; value `font-size`, `font-weight`, `line-height`, `color`, `text-wrap`, `overflow-wrap` and `font-variant-numeric`; the horizontal `columns`, `item-gap` and `item-align`; `item-padding`, `row-gap` and a `divider` between rows of a one-column list; and `panel-bg`, `panel-border-color`, `panel-radius` and `panel-padding`. Each falls back to the look KeyValueList drew before, so an unbound theme renders as it did. A new `surface="panel"` draws the theme's card surface and border, and inside `data-glass="on"` turns to the glass layer's fill, lift and blur with its edge cleared; a list with no surface never blurs. A new `as="span"` renders spans throughout, so the list fits inside a `<button>` tile.
