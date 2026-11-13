---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor-core": patch
---

VI-766: add ProportionBar, one measured total split into named parts with widths proportional to value. `parts` takes `{ label, value, fill? }`; without `fill` a part reads `--proportion-bar-fill-1` to `-4` by position, `"hatched"`, `"striped"` and `"alert"` are built in, and any other string is the part's CSS background. Parts are told apart by the ground between them, only the outer ends round, and a sliver still draws at 4px. `size` is `default` (30px) or `thin` (8px); `legend` adds swatch, label and value, with the alert part named in `--proportion-bar-alert-text`; an empty bar draws one neutral track. The bar is a `role="img"` whose name sums it ("186.5 h: On a package 92.25 h, …"). The theme engine adds the `proportion-bar` component-token family, and `paper` binds it to its money and hours colours (Slate / Deep ocean fills, Tide, Emerald stripes, coral alert). `npx visor add proportion-bar`.
