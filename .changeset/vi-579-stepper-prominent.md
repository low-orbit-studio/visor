---
"@loworbitstudio/visor": patch
---

Add `prominent` variant to `Stepper` component

The new `variant="prominent"` prop (on `Stepper`) enables a richer visual treatment for vertical derivation spines and primary-navigation surfaces: active rows get a `--interactive-primary-soft` tint, the active bullet renders a concentric halo plus a filled pulse dot (replacing the step number), and complete-to-next rails render in a primary-line tint via `color-mix`. All values are fully token-driven and theme-agnostic. Default variant behaviour is unchanged.
