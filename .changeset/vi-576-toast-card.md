---
"@loworbitstudio/visor": minor
---

feat: add ToastCard + ToastCardStack components

Absorbs ToastCard and ToastCardStack from the blessed admin-ui pattern builds into canonical Visor as `components/ui/toast-card/`. A static, server-renderable notification card for editorial display of toast anatomy in state galleries and design documentation — distinct from the imperative Toast (Sonner) component.

Variants: success | error | info | warning. Per-variant default Phosphor glyphs overridable via `icon` prop. ToastCardStack provides a fixed top-right stacking container with CSS-var-driven offset and gap.
