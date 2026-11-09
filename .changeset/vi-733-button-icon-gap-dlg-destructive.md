---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

VI-733: the Button draws what its theme keys say.

- The compact (`dlg`) destructive face reads `--interactive-destructive-bg`, `-text` and `-bg-hover`; unset, it keeps the subtle error face.
- New theme key `components.button.icon-gap`: the gap between an icon and its label (default 8px).
- A string child that is only whitespace (the `" "` in `<Icon/> {label}`) no longer becomes an empty label span, and adjacent strings join into one label.
