---
"@loworbitstudio/non-existent-package": patch
---

GATE-TEST — DO NOT MERGE

This PR exists to verify VI-419's Changeset Gate catches malformed changesets before merge. It targets `@loworbitstudio/non-existent-package` (not a real workspace member), which is exactly the VI-418 failure mode.

Expected behavior: the "Changeset presence" check fails with a "package not in workspace" error from `scripts/validate-changesets.mjs`.

After confirmation, this PR will be closed (not merged) and the branch deleted.
