---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor": minor
---

Add the `brand-strategy` top-level block to the Visor theme schema (VI-505) — the Brand Record as validated, serializable, theme-aware data: positioning, essence, personality, archetype, pillars, voice, tone, lexicon, core, and visibility. A sibling to the asset-only `brand` block (different lifecycle and consumer), present in both hand-maintained `visor-theme.schema.json` copies.

Coherence-checked the way token drift is: every pillar `governs` a real token / component / meta-surface, and every `tone` key maps to a real UI state — invalid records fail validation. The block serializes into `visor-manifest.json` under `brand_strategy`, so an agent reads `voice.traits` / `tone.error` like a component's `when_to_use`; brands marked `visibility: private` are omitted from the public manifest. The block, its types, validators, and serializer are self-contained for a future `@loworbitstudio/visor-brand` extraction.
