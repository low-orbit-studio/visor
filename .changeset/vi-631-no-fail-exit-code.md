---
"@loworbitstudio/visor": patch
---

VI-631: `visor check design --no-fail` now actually suppresses the exit code.

`--no-fail` was a no-op. Commander treats it as a **negatable boolean**, so it sets `fail: false` and never sets a `noFail` key — but both read sites tested `!options.noFail`, which was permanently `true`. Advisory mode was unreachable: a scan with errors exited `1` whether or not the flag was passed, on the human path and the `--json` path alike. This is the mechanism VI-631's warning-only rollout depends on, so a pilot project could not adopt the lint report-first.

Both sites now use the same idiom `check theme-mode` already used — `options.fail !== false` — and the interface documents the Commander mapping so the next reader does not reintroduce it.

`--no-fail` suppresses the **exit code only**: findings, the composition-scope statement and the kit-membership line still print, and `--json` still emits the full payload. It also covers the fail-closed `kit-taxonomy-missing` error, so `--composition` can be adopted advisory-first.

| Invocation | Before | After |
|------------|--------|-------|
| blessed fixture, taxonomy asserted | `0` | `0` |
| seeded violations | `1` | `1` |
| `--composition`, no taxonomy resolves | `1` | `1` |
| no flags | `0` | `0` |
| errors + `--no-fail` | `1` ✗ | `0` ✓ |

`check diff --fail-on-hits` was audited and is correct — it is a positive (non-negatable) flag, so Commander sets `failOnHits` as the code expects. `check theme-mode --no-fail` was already correct and is unchanged. Both are now covered by CLI-level exit-code regression tests that drive the real Commander tree.
