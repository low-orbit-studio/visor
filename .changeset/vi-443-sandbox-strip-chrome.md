---
"@loworbitstudio/visor": minor
---

VI-443 feat(sandbox): `visor sandbox init` now accepts `--strip-chrome` and `--strip-chrome-additional` to remove Phase 1.5 documentary chrome (state callouts, section headers, proto-nav, mint-styled annotation chips) from imported prototype HTML.

Bare `--strip-chrome` enables stripping with a default selector list shipped by the CLI: `.state-callout`, `.state-section__header`, `.proto-nav`, `[data-documentary-chrome]`, and inline-styled mint chips matching `[style*="mint"]`. Pass `--strip-chrome "<selectors>"` (comma-separated) to REPLACE the defaults with a custom list, or `--strip-chrome-additional "<selectors>"` to MERGE extras with the chosen base. The stripper runs over each `.html` file copied into `public/prototype/` before the sandbox boots, so the resulting screen routes — and any Phase 4 captures — never render those labels. The resolved selector list is recorded in `sandbox.json` under `fromHtmlPrototype.stripChromeSelectors` for traceability. Closes PL-1570 post-mortem finding #7 (operators had been hand-rolling `strip-chrome.mjs` in each sandbox dir).
