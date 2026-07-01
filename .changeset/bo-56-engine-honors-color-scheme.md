---
"@loworbitstudio/visor-theme-engine": patch
---

Generate mode-correct CSS from a theme's `color-scheme` field (BO-55). `dark-only` pins the dark palette on the host selector (`:root` / `.{slug}-theme`) with `color-scheme: dark` and omits every `@media (prefers-color-scheme: dark)` / light block; `light-only` is the inverse (`color-scheme: light`); `adaptive` is byte-for-byte unchanged. Branches the core emitters (`generateLightCss` / `generateDarkCss` / `generateFullBundleCss`), both inlining adapters (`docs`, `nextjs`), the brand-passthrough emitter, and the brand-variants pipeline. This makes the "light-at-`:root`, dark-behind-`prefers`" shape — which shipped a white app on the dark-only Animal brand — ungeneratable for single-mode brands.
