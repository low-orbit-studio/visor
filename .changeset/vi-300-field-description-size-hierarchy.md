---
"@loworbitstudio/visor": patch
---

Fix `FieldDescription` typography hierarchy — change `font-size` from `--font-size-sm` (14px) to `--font-size-xs` (12px) so description text renders visibly smaller than label text. Adds regression tests locking the CSS classes applied to `FieldLabel` (sm) and `FieldDescription` (xs).
