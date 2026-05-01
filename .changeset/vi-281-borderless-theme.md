---
"@loworbitstudio/visor": minor
---

Add `borderless` theme — a canonical V7-style dark-anchored theme that overrides `border-default`, `border-muted`, and `border-strong` to `transparent` in both light and dark modes via the existing YAML override system. Shadows are suppressed to `none` and the radius scale is tightened to 4/6/8/12 to match the V7 surface stack. Status borders (`border-focus`, `border-error`, `border-disabled`, `border-success`, `border-warning`, `border-info`) remain untouched. No source-token changes.
