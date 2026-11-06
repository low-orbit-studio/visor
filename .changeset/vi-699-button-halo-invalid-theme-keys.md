---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

VI-699: new theme keys for the Button, the focus halo and the refused field. Unset, each keeps today's look.

- **Button.** `components.button` gains `default-bg`, `default-bg-hover`, `default-text` (apart from `interactive-primary-*`), a new `hero` variant with `hero-bg`, `hero-bg-hover`, `hero-text`, `ghost-text` and `ghost-text-hover`, and `md-height`, `md-padding` and `dlg-padding`. Unset, `hero` renders as `default`.
- **Focus halo.** `components.control` gains `focus-halo-color` and `focus-halo-width`, apart from `border-focus` and `--focus-ring-width`.
- **Refused field.** `components.control` gains `invalid-ring-color` and `invalid-halo-color`; `components.input` gains `bg-invalid` (the former unlisted `--input-bg-invalid`), now read by Input, Textarea, Select and TagInput.
