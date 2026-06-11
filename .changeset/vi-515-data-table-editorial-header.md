---
"@loworbitstudio/visor": minor
---

Complete `density="editorial"` on DataTable with column-header treatment: uppercase, `--font-size-xs` (~11px), `--text-tertiary` color, and `letter-spacing: 0.08em`.

Previously `density="editorial"` only adjusted row padding (`--dt-row-py`). Column headers still rendered at the default 14px mixed-case `--text-primary` style. Now headers automatically receive the editorial-admin treatment when `density="editorial"` is set, matching the Blessing-Law organization-management design baseline (PL-1626).

`compact` and `default` densities are unchanged.
