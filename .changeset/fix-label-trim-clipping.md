---
"@loworbitstudio/visor": patch
---

Fix: Input no longer clips descenders. The label-centring trim (`text-box: trim-both cap alphabetic`) on the native `<input>` cut everything below the baseline ("Typography jpq" rendered as "Tvpoaraphv ipa"), because a native input clips its content to the trimmed line box. Input is back to its pre-centring rendering (no trim); a native input cannot be trimmed without clipping. Chromium centres its value within 0.2px at sm and within 0.9px at md and lg (the inner line box snaps to whole pixels); WebKit within 0.34px.

Chip's label and Badge no longer clip accents or descenders either: the chip label's clip box is widened (padding-block cancelled by a negative margin-block, so its layout box is unchanged), and Badge is `overflow: visible` (it is `fit-content`, so there is nothing to hide; in a short badge the ink of an accent or descender is taller than the pill, and it is now drawn rather than cut).
