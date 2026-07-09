---
"@loworbitstudio/visor": patch
---

BO-67: add a `design_ref` field to component `.visor.yaml` and a default-on, Visor-scoped render-vs-design self-check in the Component Build Workflow.

`design_ref` points at the operator-approved design a component must match. Its presence is the intrinsic trigger (W-111) for a mandatory build-time step: render the built component via `visor render` across ≥2 themes × both modes, diff each capture against the design, enumerate radius/spacing/color/alignment deltas, and fix before the PR. A new `visor-yaml-design-ref` validate rule confirms a present `design_ref` resolves. The `doc-nav` component carries a `design_ref`; `docs/audits/BO-67/` proves the check retroactively surfaces the gray-pill / radius / type / alignment deltas that had to be hand-caught across VI-611.
