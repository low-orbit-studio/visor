---
"@loworbitstudio/visor": minor
---

Add `BrowserFrame` visual component to the registry (VI-570).

Ports Blacklight's `EpkFrame` into Visor as a browser-chrome mockup frame: traffic-light dots, a URL pill with optional real link, and an arbitrary content slot. Elevation is deliberately excluded — compose with `.lit` / `.lit-soft` / `.lit-strong` from `visor-core/utilities`. Focus ring color is driven by `--browser-frame-focus-color` so themed consumers can bind a keyed accent without forking.

Install via `npx visor add browser-frame`.
