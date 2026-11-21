---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

SegmentedProgress sections (VI-809): with `steps`, each step takes a `weight` (its share of the width), a step with `onSelect` is a button for jumping back to it, a current step's `fill` (0 to 1) sets how far its segment is filled, and `revealLabels` hides pending labels and fades them in as their steps fill. Under `data-glass="on"` the labels read the theme's new `components.segmented-progress.glass-ink` (`--segmented-progress-glass-ink`) or, unbound, the glass layer's ink and the track its fill and blur; elsewhere they keep the theme's text inks and a solid track. Steps that set none of these render as before. The theme engine and schema add the `segmented-progress` family with its one key, `glass-ink`; a theme that leaves it unbound emits exactly the CSS it did before.
