---
"@loworbitstudio/visor": minor
---

VI-441 feat(sandbox): `visor sandbox approve` now writes captures to `captures/pending/` by default and adds an `--approve` flag that promotes pending → approved after operator review.

The capture flow becomes a three-state review loop — capture into pending (auto-diffed against any existing approved baseline), eyeball pending + diffs, promote with `--approve` once the captures look right. Approved captures are no longer overwritten on every run; the baseline only changes via a deliberate operator action.

The legacy `--diff` flag becomes a deprecated no-op since the default capture already pixel-diffs against the approved baseline. Pending and diff directories are cleared at the start of each capture run so stale artifacts can't sneak into the review set.

Fixes the auto-approve foot-gun from PL-1570 where first-run captures landed straight in `captures/approved/` (documentary chrome included) and required manual deletion to re-capture cleanly.
