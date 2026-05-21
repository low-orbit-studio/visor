---
"@loworbitstudio/visor": minor
---

VI-437 feat(sandbox): `visor sandbox init` accepts a `--from-html-prototype <path>` flag that imports a Phase 1.5 HTML prototype directory into the generated sandbox.

The flag copies the prototype tree into the sandbox's `public/prototype/` directory and pairs each numerically-prefixed `screen-N-*.html` source file with the matching screen in the design-handoff manifest, in order. The generated `app/screens/[name]/page.tsx` swaps the operator-edit placeholder for an iframe that loads the paired HTML — so the sandbox boots with the real Phase 1.5 composition as the baseline, not a placeholder. `sandbox.json` records the source directory and the resolved screen-to-html map so downstream tooling can re-pull when the prototype changes.

Unblocks the retro-fit pattern for pattern builds whose Phase 1.5 cleared before the sandbox CLI shipped (PL-1570, organization-management). Greenfield Phase 1.5 runs without an HTML prototype still hand-build sandbox compositions; the flag is opt-in.
