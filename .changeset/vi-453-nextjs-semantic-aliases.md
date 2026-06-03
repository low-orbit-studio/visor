---
"@loworbitstudio/visor-theme-engine": minor
---

The `nextjs` theme adapter now emits the full `visor-semantic` cascade layer (VI-453).
It outputs all 38 semantic aliases — intent shortcuts (`--primary`, `--accent`,
`--success`, `--warning`, `--destructive`, `--info`, `--primary-text`), hairlines
(`--hairline`, `--hairline-strong`), surface/text extensions (`--surface-screen`,
`--surface-elev`, `--text-muted`), and discrete pixel scales (`--text-{11..48}`,
`--space-{1..16}`) — reusing the same generators the `docs` adapter consumes. Mode
scoping mirrors the docs adapter: `html:not(.dark)` for light, `html.dark`
(+ `prefers-color-scheme: dark`) for dark; discrete scales emit unconditionally in
`:root`.

**Consumer impact:** themes generated via `npx visor add theme` now ship a populated
`visor-semantic` layer. Consumers who declared a bridge `:root` block to fill these
aliases can delete it after regenerating their theme CSS against this release.
