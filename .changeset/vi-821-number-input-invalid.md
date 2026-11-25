---
"@loworbitstudio/visor": patch
---

NumberInput invalid look (VI-821): when its input carries `aria-invalid="true"`, NumberInput draws the same invalid fill and inset ring Input draws, from the shared `--input-bg-invalid` and `--control-invalid-*` tokens, and keeps the ring while focused. Under `data-glass="on"` it takes the Field box's glass error look (the glass hover fill and an ink line).
