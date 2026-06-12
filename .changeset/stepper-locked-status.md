---
"@loworbitstudio/visor": patch
---

Add `locked` status to the Stepper component (VI-550).

- `StepperItem` and `StepperTrigger` accept `status="locked"` as an explicit per-item override — never auto-derived from `activeStep`.
- Locked triggers render a Phosphor `Lock` icon, set `aria-disabled="true"`, are removed from the tab order (`tabIndex={-1}`), and suppress `onClick` handlers.
- Title text is rendered in the secondary/muted color when the parent item is locked.
- New `.trigger--locked` CSS class added to `stepper.module.css` using `--border-muted`, `--text-tertiary`, and `--opacity-60` tokens.
