---
"@loworbitstudio/visor": patch
"@loworbitstudio/visor-theme-engine": patch
---

FieldError's icon sits at the top left: centred on the message's first line, so a message that wraps runs on below it instead of the icon centring against every line (VI-862). `field.error-icon-size` now sets the icon's width and height, so a theme sizes it even when the icon was passed a fixed size.
