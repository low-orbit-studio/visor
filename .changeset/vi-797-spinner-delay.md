---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

Spinner takes a `delay` (milliseconds): it shows nothing until the wait passes, then fades in, so a quick load never flashes it. The delay is a CSS `animation-delay`, so server and client markup match, and under reduced motion the ring stops turning but still fades in. A new `showLabel` option shows the `label` as visible words beside the spinner, in one `role="status"` wrapper that the delay fades as a whole. Callers that set neither render exactly as before. The theme engine's `spinner` family gains `appear-duration`, `label-gap`, `label-font-size`, `label-font-weight` and `label-color`.
