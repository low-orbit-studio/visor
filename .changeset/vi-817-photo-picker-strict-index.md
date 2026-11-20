---
"@loworbitstudio/visor": patch
---

PhotoPicker type-checks under a consumer's `noUncheckedIndexedAccess` without non-null assertions: the wave-animation index reads are guarded. Behaviour is unchanged. PhotoPicker is now covered by the strict-index check.
