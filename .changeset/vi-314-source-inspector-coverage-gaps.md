---
"@loworbitstudio/visor": patch
---

Improve `SourceInspector` classifier coverage on Next 16 / Turbopack. `extractFirstUserUrl` now skips unnamed `at https://…` frames whose URL points at a known runtime chunk (visor `jsxDEV` shim, `react-dom`, `react-server-dom`, `/_next/dist/`, `/node_modules`), so user-source frames surface even when wrapped in anonymous runtime calls. A new `inheritStamps` pass walks the DOM ancestry of every `data-source="dom"` element and inherits the nearest stamped `visor` or `local` ancestor, so server-component leaves and elements without `_debugOwner` classify under their owning shell instead of falling through to `dom`.
