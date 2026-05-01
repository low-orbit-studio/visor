---
"@loworbitstudio/visor": patch
---

Ship `@loworbitstudio/visor-core` CSS pre-wrapped in `@layer` blocks so generated themes (e.g., from `visor theme apply --adapter nextjs`) win the cascade against visor-core's defaults without consumer intervention. Per the CSS Cascade Layers spec, unlayered styles always beat layered styles — visor-core previously emitted unlayered `:root { ... }` rules, which silently won over generated themes wrapped in named layers. Every shipped `dist/*.css` now declares the layer order `@layer visor-primitives, visor-semantic, visor-adaptive, visor-bridge;` and wraps content in the matching tier; consumer overrides written outside any layer continue to win, as documented.
