---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor-core": minor
---

VI-470 feat: brand block in theme schema + visor-brand layer emit.

Adds a `brand` block to the Visor theme schema and a brand subsystem modeled on the fonts subsystem. Themes can declare per-slot brand assets (`logo`, `brandmark`, `wordmark`, `monochrome`, `favicon`, plus `custom` slots); the engine emits mode-scoped `--brand-{variant}` CSS variables (with explicit `-light`/`-dark` forced-mode aliases) and per-variant `clearSpace`/`aspectRatio` tokens into a dedicated `visor-brand` cascade layer, ordered immediately after `visor-semantic`.

Phase 1 (no CDN): `source: local` resolves to `public/`-relative paths. Stock themes that omit a `brand` block fall back to the Visor default brand. The shared `LAYER_ORDER` declaration in both the theme-engine adapters and `visor-core` gains `visor-brand` for cascade consistency.
