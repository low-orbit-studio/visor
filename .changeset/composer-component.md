---
"@loworbitstudio/visor": minor
---

Add `Composer` — AI-chat composer compound component (VI-555).

A rounded card container holding an auto-growing multi-line text field and a tools row with icon buttons, an arbitrary status-chip slot, and a circular primary send button.

- **Compound API**: `Composer` (root, manages field value + submit), `ComposerField` (auto-growing textarea; Enter submits, Shift+Enter inserts newline), `ComposerToolbar` (flex tools row), `ComposerToolButton` (32px circular bordered icon button), `ComposerSpacer` (flex spacer), `ComposerSend` (34px circular primary send button, auto-disabled when field is empty).
- Supports both **controlled** (`value` / `onValueChange`) and **uncontrolled** modes; uncontrolled clears the field after submit.
- `disabled` on the root propagates to all interactive children.
- All values reference design tokens — no hard-coded colors, shadows, or spacing.
- Focus rings via `var(--focus-ring-width)` / `var(--focus-ring-offset)`.
- Respects `prefers-reduced-motion`.
- Installed via `npx visor add composer`.
