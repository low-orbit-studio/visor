---
"@loworbitstudio/visor": patch
---

Fix `SourceInspector` classifier on React 19 / Next 16. Previously the classifier read `fiber._debugSource.fileName`, a property React 19 removed — so every rendered element fell through to the `"dom"` label and no overlay tints applied even when the runner was mounted. The classifier now walks to `fiber._debugOwner` and parses the JSX call-site URL out of `_debugStack` (an `Error` whose stack trace points to user source). Skips React-internal frames (`react-stack-bottom-frame`, `react-server-dom`, `react-jsx-dev-runtime`, `jsxDEV`/`jsxs?`) so the first user frame surfaces. Also normalizes `_debugStack` shape — handles `string`, `Error`, and plain objects with a `stack` property.
