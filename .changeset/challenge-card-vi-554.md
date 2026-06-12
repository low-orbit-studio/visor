---
"@loworbitstudio/visor": minor
---

Add `ChallengeCard` component (VI-554) — a first-class adversarial challenge message with a human gate affordance.

- **`ChallengeCard`** — root container with `role="alert"` and warning-soft background / warning-line border.
- **`ChallengeCardHeader`** — uppercase warning-toned title with a default `Flag` icon (overridable or suppressible).
- **`ChallengeCardBody`** — prose body text.
- **`ChallengeCardActions`** — flex row for action buttons and gate indicator.
- **`ChallengeCardAction`** — real `<button>` with `variant="primary"` (filled warning-toned with dark text) or `variant="ghost"` (transparent + border). Includes focus rings via `var(--focus-ring-*)` tokens.
- **`ChallengeCardGate`** — lock icon + "You hold the gate" label (overridable), pushed right via `margin-left: auto`.

Distinct from `Alert` (passive notices) — ChallengeCard is for adversarial AI prompts that require an explicit human decision before proceeding.
