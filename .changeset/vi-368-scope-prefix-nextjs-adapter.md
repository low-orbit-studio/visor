---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor": patch
---

VI-368: add `--scope-prefix` option to the nextjs theme adapter.

`visor theme apply --adapter nextjs` now accepts an optional `--scope-prefix <selector>` flag that wraps all generated CSS under the supplied selector instead of `:root`. This enables the body-class repaint pattern that `/lo-prototype-to-visor` Phase 3 prescribes, where multiple themes coexist on a page and swap via a body class (e.g. `body.blacklight-theme`).

**Behavior when `--scope-prefix 'body.blacklight-theme'` is set:**

- Primitives + light tokens emit under `body.blacklight-theme { ... }` instead of `:root { ... }`.
- The manual-toggle dark block scopes to the composed selectors `body.blacklight-theme.dark`, `body.blacklight-theme.theme-dark`, `body.blacklight-theme[data-theme="dark"]` — matching the body-class + `html.dark` dual-toggle pattern used by R2's `body.entr-theme` / `body.blackout-theme`.
- The `@media (prefers-color-scheme: dark)` block composes the prefix with the existing `:not(.light)` guards: `body.blacklight-theme:not(.light):not(.theme-light):not([data-theme="light"])`.

**Backward compatible.** When `--scope-prefix` is omitted, output is unchanged (`:root` selectors), so existing setups continue to work without modification.

New programmatic option `NextJSAdapterOptions.scopePrefix?: string` on `nextjsAdapter()` for callers using the adapter directly. The same prefix is threaded through `generatePrimitivesCss`, `generateLightCss`, and `generateDarkCss` via an optional `options.scopePrefix` parameter on each.
