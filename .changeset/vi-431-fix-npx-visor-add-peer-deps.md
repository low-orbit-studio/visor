---
"@loworbitstudio/visor": patch
---

VI-431 fix: `npx visor add` now installs all transitive peer dependencies of the added component.

Fixes a silent partial-install bug where the CLI reported success after writing component files but skipped peer dependencies referenced by their imports (e.g. `@radix-ui/react-slot` for `button`, `class-variance-authority` for `input` and `textarea`), causing the consumer's next `next build` to fail with `Cannot find module`. Audits every React-target registry item against its source-file imports and adds a self-validating regression test (`auditRegistryDependencies`) that runs against the built `dist/registry.json` so future drift fails CI before reaching consumers. Treats `react` and `react-dom` as assumed peer deps per shadcn convention.
