---
"@loworbitstudio/visor": minor
---

Remove the duplicate `wizard-flow` pattern; `onboarding-flow` is now the single canonical multi-step-flow pattern.

`wizard-flow` and `onboarding-flow` described the same archetype (stepper + progress + field + input + button + alert), which split agent/author selection. Before removing it, `wizard-flow`'s broader `when_to_use` signal — checkout/multi-step sequences, "a single long form would overwhelm the user → break into steps," and "earlier steps gate or inform later steps" — was folded into `onboarding-flow`, and its `description` was broadened so the survivor covers first-run **and** checkout/generic multi-step flows. No selection signal is lost.

Consumers who already ran `npx visor add wizard-flow` keep their copy (copy-and-own); the pattern is simply no longer offered by the registry.
