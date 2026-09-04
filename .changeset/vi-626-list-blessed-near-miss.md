---
"@loworbitstudio/visor": patch
---

VI-626: `visor spawn --list-blessed` now reports near-miss builds instead of silently omitting them.

A directory carrying a full `reference-build/` and an approved `captures/approved/` baseline but no `blessed-manifest.json` was walked straight past by discovery. `--list-blessed --json` reported that as a clean `success: true` with `errors: []` — an operator or agent asking "what can I spawn?" was told about one build with no hint that five more were a single file away from spawnable.

Discovery now classifies such a directory as a **near-miss** and returns it in a sibling `incomplete[]` array, each entry carrying the directory and a `reason` (`missing blessed-manifest.json`). `spawn --list-blessed` surfaces it in both the JSON payload and a "Near-miss builds (not spawnable)" section of the human output.

Nothing about blessing changes. Discovery does not synthesize a manifest: a near-miss is excluded from `builds[]`, stays out of the "available builds" hint, and `spawn --from` against one fails with the same loud error as before. `incomplete[]` is deliberately a sibling of `errors[]` — a near-miss is a finding about the catalog, not a failure of the discovery operation — so `success` stays `true` and `errors` stays reserved for unreadable directories and malformed manifests.
