---
"@loworbitstudio/visor": patch
---

VI-369 fix: `visor --version` now reads from the CLI's own `package.json` instead of a hardcoded string.

The CLI entrypoint was passing a stale literal (`"0.3.0"`) to commander's `.version()`. Replaced with a runtime read of `packages/cli/package.json` via the existing ESM `fileURLToPath(import.meta.url)` + `readFileSync` pattern used elsewhere in the CLI. Added a regression test that builds the dist binary, execs `--version`, and asserts the output matches the `version` field in `package.json` — so any future drift between hardcoded and published version is caught in CI.
