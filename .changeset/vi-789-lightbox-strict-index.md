---
"@loworbitstudio/visor": patch
---

Lightbox type-checks under a consumer's `noUncheckedIndexedAccess` without non-null assertions: the touch and preload index reads are guarded. Behaviour is unchanged. Lightbox is now covered by the strict-index check.
