---
"@loworbitstudio/visor": patch
---

VI-422 feat: `theme sync` continues past broken themes and summarizes failures at the end.

Previously, `visor theme sync` aborted on the first per-theme failure (e.g. a font-coverage error in one private theme), blocking every healthy theme from syncing. Now each theme is processed in isolation: failures are collected, every healthy theme syncs, and a structured summary names the failed themes at the end. Exit code is non-zero iff any theme failed. The D6 contract is preserved — when every theme fails, the sync bails before the write phase so pre-existing CSS is never wiped.

JSON envelope adds a `failures: Array<{filePath, error}>` field when per-theme failures occur. The legacy `errors: string[]` field is removed; consumers should switch to `failures`. All-healthy runs are unchanged.
