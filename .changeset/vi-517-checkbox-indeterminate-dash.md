---
"@loworbitstudio/visor": patch
---

Checkbox indeterminate state now renders a Minus/dash glyph (–) instead of a Check mark.

When `checked="indeterminate"`, the `MinusIcon` from `@phosphor-icons/react` is rendered inside the Radix `Indicator`. Checked state continues to render `CheckIcon`. Unchecked state renders nothing (Radix hides the Indicator). This fixes partial-selection header checkboxes (e.g. org-list select-all) that incorrectly showed a check mark.
