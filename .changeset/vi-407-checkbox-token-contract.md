---
"@loworbitstudio/visor": minor
---

VI-407 feat: Checkbox primitive gains a 6-hook token contract for theme-portable styling.

Borderless themes (those that zero `--border-default`) lost the Checkbox hairline. The primitive now exposes a full state-machine surface that falls back through existing semantic tokens — byte-for-byte unchanged for themes that don't bind any of the new hooks:

- `--checkbox-border` / `--checkbox-bg` — unchecked
- `--checkbox-border-hover` / `--checkbox-bg-hover` — hover (unchecked)
- `--checkbox-border-checked` / `--checkbox-bg-checked` — checked + indeterminate

A new `.root[data-state="indeterminate"]` rule mirrors `[data-state="checked"]` so the partial-selection state tracks the checked treatment via the same hooks. Themes that need a different look (e.g. ENTR's borderless-but-visible mint chip) can now override on `body.<theme>` with a 6-line token rebind instead of forking the component CSS.
