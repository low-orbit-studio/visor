---
"@loworbitstudio/visor": minor
---

Add a durable guardrail against composition-pattern duplication (closes the wizard-flow/overlap class of drift from VI-535/536).

- Every pattern now carries a `when_not_to_use` disambiguation surface (≥1 item naming its nearest-neighbor pattern), published in `visor-manifest.json` alongside `when_to_use` so agents can tell near-duplicates apart.
- New `pattern-overlap-detection` validate rule: any two patterns whose `components_used` are highly similar (Jaccard ≥ 0.6) must mutually reference each other in `when_not_to_use`, or the rule flags them. It runs in `npm run validate` and fails `validate:strict` (CI).
- `discoverability-selection-quality` now requires `when_not_to_use` on patterns (mirroring the existing component check).
- All pattern `name:` fields standardized to kebab-case to match their file slug (manifest keys are slug-based, so this is metadata consistency only).
