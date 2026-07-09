---
"@loworbitstudio/visor": patch
---

VI-613: DocFrame text-fallback wordmark now renders in the theme's display face.

When a theme ships no `--brand-logo` (or the brand asset fails to load) and DocFrame falls back to the `manifest.brand` text wordmark, the wordmark now uses `var(--font-display, var(--font-family-heading, inherit))` instead of the ambient `--font-sans`. A text wordmark now carries the theme's brand character — e.g. Animal's condensed "Sequel 100 Black 95" instead of the body "Ratio" — matching the display-font convention already used by `stat-card`, `page-header`, and `section-intro`, and degrading gracefully (heading face → ambient sans) on themes that ship no `--font-display`. Brand-logo resolution from the private visor themes (the mode-aware `--brand-logo` SVG path) is unchanged and verified end-to-end in `docs/audits/VI-613/`.
