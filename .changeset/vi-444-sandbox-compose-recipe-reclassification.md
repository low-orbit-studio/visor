---
"@loworbitstudio/visor": patch
---

VI-444 fix(sandbox): handoff entries declared "shipped" but missing from the Visor registry are now auto-reclassified as `compose-recipe` (consumer-side compositions of existing primitives) instead of being skipped with a warning.

`visor sandbox init` now treats a Gate 3 miss on a `shipped` or `gap-inflight` entry as a signal that the handoff is describing a consumer-side composition. The entry's `status` is rewritten to `compose-recipe` and its `viTicket` is cleared before the scaffold runs, so both `sandbox.json` and `lib/sandbox-manifest.ts` surface the correct classification, no stub is generated, and `npx visor add` is not invoked for it. A softer informational warning (`'X' declared shipped in the handoff but absent from the registry — reclassified as compose-recipe`) is emitted in place of the prior skip warning. Mirrors PL-1570 finding #8.
