---
"@loworbitstudio/visor-theme-engine": minor
---

VI-445 feat: per-theme CDN routing for `source: visor-fonts`.

Themes can now declare `typography.cdn-overrides.visor-fonts` to route their licensed-font URLs at a project-owned bucket instead of the shared `fonts.visor.design`. When the override is in play, the per-slot `org` may be empty (the override CDN encodes the project namespace), and resolution emits `{cdn}/{slug}/{prefix}-{weight}.woff2`. Preconnect hints deduplicate per unique CDN. Schema validation relaxes the `org` requirement only when an override is set and rejects empty override URLs.

This unblocks Knowmentum's Hoefler Gotham bucket (EULA-mitigation CORS scoped to knowmentum.ai origins) and the same pattern for any future Lineto/Hoefler-style font under a theme-specific license. Themes without an override resolve to `fonts.visor.design` exactly as before — fully backwards compatible.
