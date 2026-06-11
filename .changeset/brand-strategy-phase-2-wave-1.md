---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor": minor
---

Extend the `brand-strategy` block with the Phase 2 wave-1 fields (VI-541), mirroring the Phase 1 schema work in VI-505. All new fields are optional and additive, so existing brand records keep validating unchanged.

- **Engine `BrandStrategy` type** gains optional `messaging` (message-house roof), `taglines`, `boilerplate` (short/long), `colorUsage` (allowed pairings), and `accessibility` (WCAG 2.1 AA standard + contrast targets), plus optional per-pillar `proof[]` (reasons-to-believe). New exported types: `BrandMessaging`, `BrandBoilerplate`, `BrandColorPairing`, `BrandColorUsage`, `BrandContrastTarget`, `BrandAccessibility`.
- **Validation** (`validateBrandStrategy`) admits the five new top-level keys and applies deep per-field rules only when a field is present.
- **Serialization** (`serializeBrandStrategy`) projects the new fields into the agent manifest's `brand_strategy` (all public; a `private` record still drops the whole strategy).
- **Schema** — both `visor-theme.schema.json` copies (engine + docs) carry the new `$defs` and `brand-strategy` properties, byte-identical (schema-copies-sync).
- **Manifest** — the CLI's emitted `brand_strategy` now carries the new public fields; `SerializedBrandStrategy` (re-exported in the manifest type) flows them through automatically.
