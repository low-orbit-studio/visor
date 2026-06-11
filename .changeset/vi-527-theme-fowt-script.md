---
"@loworbitstudio/visor-theme-engine": minor
---

Add `generateThemeFowtScript` to `@loworbitstudio/visor-theme-engine/fowt` (VI-527). A pre-paint script generator for the theme-identity (palette) axis, orthogonal to the dark/light `generateFowtScript` mode axis. It reads a stored theme name, validates it against a registered-theme allowlist (falling back to a default when unknown/absent/unreadable), stamps a configurable attribute (default `data-theme-name`) on `<html>`, and toggles `disabled` across inlined `style[data-theme-css]` elements. ES5-safe, mirroring the existing FOWT conventions, so both axis scripts can share one `<head>`.
