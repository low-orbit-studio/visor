---
"@loworbitstudio/visor-theme-engine": patch
"@loworbitstudio/visor-core": patch
---

Scoped themes now re-substitute visor-core's twelve mode-dependent aliases with the right referent in each mode (VI-696). The twelve are `--sidebar-*`, `--border-input`, `--skeleton-from`/`-to` and `--chart-1`. Both the nextjs adapter (`scopePrefix`) and the docs adapter (`.{slug}-theme`) emit them.

- **Light:** the scope block carries the light referent, as before.
- **Dark:** the adapter's dark selectors re-declare them with the dark referent (for example `--sidebar-bg: var(--color-neutral-900)`). That covers the manual toggle and the `prefers-color-scheme` block. A `dark-only` theme gets the dark referents on its host instead.

**nextjs adapter.** It used to re-declare all twelve flat with the light referent. A scoped theme in OS dark mode therefore rendered the Sidebar in the theme's near-white `neutral-50`, and `--border-input` in `neutral-200`. A dark-only scoped theme got the same light mappings in every mode. The manual toggle on `body` was not affected, because visor-core's own `.dark` rule matched the body.

**docs adapter.** It used to skip the twelve, so they kept visor-core's own palette. This affects `visor theme apply --adapter docs` output, visor-core's `dist/themes/*.css`, and the theme CSS that the docs site and `visor render` read.

**New exports:**
- `VISOR_CORE_DARK_SEMANTIC_ALIASES` maps alias to dark referent. It is pinned against `tokens.css`.
- `generateSemanticAliasDecls` takes an optional `{ table }`.
- `collectDeclaredProperties` takes an optional `{ exclude }` list of selectors.

`MODE_DEPENDENT_SEMANTIC_ALIASES` is now derived from the dark table. Output for `:root`-scoped themes is unchanged.
