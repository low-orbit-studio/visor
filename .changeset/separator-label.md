---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

Separator takes `label` (VI-671): text centred on a horizontal rule, with the rule drawn on both sides on the same `--border-default` token. A labelled separator is never decorative: it exposes `role="separator"` named by the label, so the word is read. `label` is ignored on a vertical separator. The rule reads the new `--separator-color` (`components.separator.color`), falling back to `--border-default`, so a borderless theme can keep it visible. New render fixtures: `separator` `default` / `labelled`.
