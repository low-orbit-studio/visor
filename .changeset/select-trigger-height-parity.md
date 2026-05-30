---
"@loworbitstudio/visor": patch
---

Select: the trigger height now matches a same-size Input. The trigger was inheriting `line-height: 2.0`, rendering the dropdown ~7px taller than text fields across every theme; it now pins `line-height: 1.5` to track the field height.
