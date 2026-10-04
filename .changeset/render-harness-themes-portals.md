---
"@loworbitstudio/visor": patch
---

`visor render` puts the theme class on `<body>` instead of the inner `#theme-scope` div, so portaled panels (popover, select, dialog, tooltip, date-picker and the rest) render on the theme under test, as they do in a real app. Adds `select --fixture open` and a `tooltip` fixture.
