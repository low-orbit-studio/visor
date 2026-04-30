---
"@loworbitstudio/visor": patch
---

Fix `SourceInspectorToggle` standalone auto-mount so it actually applies the overlay. Previously the lazy mount only included `SourceInspectorProvider` (context + state) but not `SourceInspectorRunner` (DOM stamping, MutationObserver, body class), so clicking the toggle cycled the icon dot but never produced a visible overlay. The lazy mount now uses `<SourceInspector>`, which already detects an existing context and only mounts a provider/runner when needed — so nested usage is unchanged and standalone usage works as the JSDoc promised.
