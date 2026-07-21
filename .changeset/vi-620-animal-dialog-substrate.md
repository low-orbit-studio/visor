---
"@loworbitstudio/visor": minor
---

VI-620: Animal dialog substrate. Adds two mid-tier blocks — `dialog-form` (compact admin modal shell composing the Dialog atom: backdrop + centered panel + header + dlg-btn footer, with a title size axis) and `dialog-field` (`dlg-field`: flex-column field — a sentence-case label over a borderless, medium-size control on a theme-derived surface that stays legible against the card in every theme, with leading-icon / trailing-caret slots) — plus a `dlg` compact Button size (dialog-footer button whose primary/ghost/danger faces reuse the variant axis) and a `mono` StatusBadge prop (monospace-token label). All token-driven; the active theme swaps every surface, hairline, radius, and scale.
