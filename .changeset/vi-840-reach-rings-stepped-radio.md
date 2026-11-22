---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

VI-840: add ReachRings and a stepped RadioGroup variant. `<ReachRings levels={4} value={n} icon={…} size="default" | "compact" />` draws concentric rings, the innermost a filled core holding the icon, and lights `value + 1` of them from the centre out (0 = the core alone, `levels - 1` = every ring, -1 = none), 70ms apart over a 500ms ease-out, with no transition under `prefers-reduced-motion`. It is `aria-hidden`; 148px across with 20px steps, or 112px with 15px steps compact. `<RadioGroup variant="stepped">` draws one row of equal tiles in a well, each `RadioGroupItem` an `icon` over its `title`; the chosen tile takes a 12% key fill, a 35% key hairline and a lit top edge, a disabled tile drops to 35% and is skipped by the arrow keys, and `size="compact"` sets the labels at 10px. The theme engine adds the `reach-rings` (key, ring, glyph, core-ink) and `radio-step` (key, well, well-radius, ink, icon-size, selected-bg, selected-border) component-token families. `npx visor add reach-rings`.
