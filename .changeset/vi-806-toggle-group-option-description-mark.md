---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

ToggleGroup's option rows take a `description` line and, on a single group, a round mark. `description` on a `ToggleGroupItem` adds a second line under the label; the label stays the row's accessible name and the description becomes its accessible description, after any `aria-describedby` id the caller passes. `mark` on a single option group puts a round mark on each row that fills with a check in the theme's key colour (`--interactive-primary-bg`) when the row is picked. The multiple-choice box now draws the same Phosphor bold check. The row's blur now reads the glass layer: it is `--glass-on-control-blur` inside `data-glass="on"` and none everywhere else, so plain pages get solid rows. The theme engine adds `option-description-text` and `option-description-font-size` to the `toggle-group` family and drops `option-blur`, which the glass layer's `control-blur` replaces; a theme that still binds `option-blur` must remove it. Without the new props, rows render the markup they did before.
