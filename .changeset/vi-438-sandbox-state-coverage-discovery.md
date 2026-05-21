---
"@loworbitstudio/visor": minor
---

VI-438 feat(sandbox): when `--from-html-prototype` is set, `visor sandbox init` now auto-discovers state-coverage screens — any `screen-N-*.html` files beyond the manifest's named-screen count are appended to the sandbox as `state-coverage` screens with predictable slugs derived from the filename suffix.

Example: a prototype directory with `screen-1-list.html`, `screen-2-detail.html`, `screen-3-menus.html`, `screen-4-feedback.html`, `screen-5-edge-states.html` and a handoff that names two screens produces the two named routes plus `state-coverage-menus`, `state-coverage-feedback`, `state-coverage-edge-states`. Each state-coverage screen iframes its source HTML and is recorded in `sandbox.json` under `fromHtmlPrototype.stateCoverageScreens`, restoring per-state baseline coverage for the Phase 4 state-coverage diff gate. `ScreenEntry` gains an optional `kind: 'named' | 'state-coverage'` field that surfaces in the runtime `sandbox-manifest.ts` module so downstream tooling can filter by category.
