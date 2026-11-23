---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor-core": patch
"@loworbitstudio/visor": patch
---

VI-841: `forceSquircleFallback(css)`, a test-only hook that draws the Safari squircle fallback in any engine. It turns every `@supports not (corner-shape: squircle)` gate into `@media all` and turns native `corner-shape` off, so fallback tests keep working in a Playwright WebKit that draws `corner-shape` natively (1.64+). Production CSS is unchanged. The concentric scan (`visor-core/test-utils`) now reads a box drawing the fallback as a squircle even where the engine also reports a native corner.
