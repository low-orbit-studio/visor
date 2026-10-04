---
"@loworbitstudio/visor": minor
---

Separator takes `label` (VI-671): text centred on a horizontal rule, with the rule drawn on both sides on the same `--border-default` token. A labelled separator is never decorative: it exposes `role="separator"` named by the label, so the word is read. `label` is ignored on a vertical separator. New render fixtures: `separator` `default` / `labelled`.
