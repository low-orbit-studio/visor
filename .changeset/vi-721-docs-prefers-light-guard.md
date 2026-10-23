---
"@loworbitstudio/visor-theme-engine": patch
---

Docs adapter: `@media (prefers-color-scheme: dark)` blocks now carry an `html:not(.light)` ancestor guard, so an explicit docs light mode is no longer overridden by an OS in dark mode.
