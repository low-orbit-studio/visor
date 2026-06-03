---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor-core": minor
---

Add a 6-tier letter-spacing ramp to typography tokens (VI-447). The theme schema's
`typography.letter-spacing` block now accepts `xl | lg | md | sm | xs | tight` and the
engine emits a matching `--letter-spacing-{xl,lg,md,sm,xs,tight}` ramp, resolved per
theme (em-based defaults: xl `0.16em` → tight `-0.01em`, with `md` anchored at `0.05em`).

Additive and back-compatible: the legacy triad keys stay valid input and fold onto the
ramp (`normal`→md, `wide`→lg, `tight`→tight), and the engine still emits
`--letter-spacing-normal` (= md) plus a new `--letter-spacing-wide` (= lg) alias, so
existing consumers resolve unchanged. Editorial themes can now carry a coherent rem-based
letter-spacing system that the previous `tight | normal | wide` triad could not express.
