---
"@loworbitstudio/visor": patch
---

DocFrame: stop hardcoding private theme slugs (VI-614). The `borderless` treatment no longer auto-detects from a baked-in `["animal-theme", "entr-theme"]` set — which leaked private theme identity into the public bundle (caught by the private-theme leak guard) and violated theme-agnosticism. Borderless now comes only from the explicit `borderless` prop or a theme nulling `--doc-nav-pin-border` in its own CSS.
