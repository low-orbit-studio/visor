---
"@loworbitstudio/visor": patch
---

Fix: Input no longer clips descenders. The label-centring trim (`text-box: trim-both cap alphabetic`) on the native `<input>` cut everything below the baseline ("Typography jpq" rendered as "Tvpoaraphv ipa"), because a native input clips its content to the trimmed line box. Input is no longer trimmed (a native input cannot be trimmed without clipping). To keep it centred, Chromium moves padding from the bottom edge to the top at md and lg (their baseline snaps to a whole px), with the box size unchanged: capitals land within 0.5px at every size in Arial, Product Sans and PP Model Mono; WebKit within 0.34px.

Chip's label and Badge no longer clip accents or descenders either: the chip label's clip box is widened (padding-block cancelled by a negative margin-block, so its layout box is unchanged), and Badge is `overflow: visible` (it is `fit-content`, so there is nothing to hide; in a short badge the ink of an accent or descender is taller than the pill, and it is now drawn rather than cut).
