---
"@loworbitstudio/visor": minor
---

VI-356 feat: derive Typography Font Families specimen weight rows from the active theme's manifest instead of a hardcoded `[400, 500, 600, 700]` / `[400, 500, 700]` grid.

The docs-site `PRIVATE_THEMES` manifest now carries each theme's actual loaded weights per typography slot (extracted at build time from `.visor.yaml` by a new `extract-typography-slots.mjs` helper). `DesignSystemSpecimen` accepts an optional `themeManifest` prop and a `fontFamilies` prop derived from it; an internal `useActiveThemeSlug` hook listens for `visor-theme-change` body-class transitions and re-renders rows when the active theme switches. Themes without `typography` declared in their manifest entry fall back to the legacy hardcoded defaults — no breaking changes for existing consumers.

Affects: any consumer of `blocks/design-system-specimen` that wants per-theme weight rows. Stock themes (e.g., `neutral`) keep the legacy defaults. Themes that load `[300, 400, 500, 700, 800]` (e.g., Blacklight) now render five rows per family; themes that load only two weights render two.
