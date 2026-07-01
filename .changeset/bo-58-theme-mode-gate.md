---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": patch
---

Add a deterministic `visor check theme-mode <path>` gate (BO-58). It reads a theme's declared `color-scheme` (`dark-only | light-only | adaptive`) and asserts the app-root background (`--surface-page`) luminance matches the declared mode — `dark-only` must render dark, `light-only` must render light, `adaptive` is skipped. Emits machine-readable JSON (`{ pass, mode, computed_bg, luminance, ... }`, surfacing the offending computed color on failure) for pipeline wiring, plus a human-readable mode. Reuses the theme engine's own resolution and its `getLuminance()` (now re-exported from the engine index) rather than reinventing luminance math or booting a browser. Catches the failure class where a dark-only brand ships a light app root — invisible to structural oracle/freeze gates.
