---
"@loworbitstudio/visor-theme-engine": patch
---

VI-420 feat: theme validator catches override-incompleteness — would have caught VI-417.

`validate()` in `packages/theme-engine/src/validate.ts` now emits `INCOMPLETE_OVERRIDE` warnings when a theme manifest declares `overrides.light` with a `surface-page` or `surface-card` override (signaling inverted always-dark light treatment) but omits the leak-prone semantic tokens that the engine would otherwise resolve to bright light-mode defaults.

The required set covers text (4), surface (20), border (4), and interactive (7) tokens whose engine defaults leak on inverted themes. Saturated brand/status tokens are excluded — their defaults render correctly across modes.

Trigger is narrowed to `surface-page` / `surface-card` overrides specifically (D1's literal "text-* or surface-*" rule false-positives on light-bg themes that stylistically tweak text alphas like modern-minimal, neutral, space). Dark-mode completeness is intentionally out of scope — engine dark defaults are already dark and rarely leak symmetrically.

Severity: WARNING (D3) — non-blocking. Operators may have intentional reasons for partial overrides, and emerging themes shouldn't be blocked.

Live verification:

- `npx visor theme validate themes/blackout.visor.yaml` → 0 INCOMPLETE_OVERRIDE warnings (post-VI-417 baseline is clean).
- Pre-VI-417 Blackout fixture → 19 INCOMPLETE_OVERRIDE warnings, exactly matching the tokens VI-417 added.
- modern-minimal, neutral, space → 0 INCOMPLETE_OVERRIDE warnings (no false positives).
- borderless → 25 warnings (true positive — same class of bug as pre-VI-417 Blackout, follow-up).
