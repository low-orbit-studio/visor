---
"@loworbitstudio/visor": patch
---

Fix: form controls now inherit the page `font-family`. `button`, `input`, `select`, and the composite inputs (`number-input`, `search-input`, `password-input`, `combobox`, `tag-input`, `otp-input`) declared no `font-family`, so in consumer apps without a global CSS reset they rendered in the browser's default UA font instead of the theme font (`textarea` already carried the fix). Adds `font-family: inherit` on the control element — font-size and font-weight are unchanged. (VI-510)
