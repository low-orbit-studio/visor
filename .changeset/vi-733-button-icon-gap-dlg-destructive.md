---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

VI-733: the Button draws what its theme keys say.

- The compact (`dlg`) destructive face reads new theme keys `components.button.dlg-destructive-bg`, `-bg-hover` and `-text`; unset, it keeps the subtle error face. It does not read `--interactive-destructive-*`, which the solid destructive button owns and tokens.css always defines.
- New theme key `components.button.icon-gap`: the gap between an icon and its label (default 8px).
- A string child that is only whitespace (the `" "` in `<Icon/> {label}`) no longer becomes an empty label span, and adjacent strings join into one label.
