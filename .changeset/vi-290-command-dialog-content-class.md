---
"@loworbitstudio/visor": minor
---

Forward `contentClassName` and `contentProps` from `CommandDialog` to the wrapped `DialogContent`, so consumers can customize the dialog content element without forking the composition. `contentProps` omits `className` and `children` to prevent conflicts with the existing API.
