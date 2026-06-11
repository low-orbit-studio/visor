/**
 * Brand-strategy block for the Visor theme engine (VI-505).
 *
 * The Brand Record as validated, serializable, theme-aware data — a top-level
 * `brand-strategy` block in `.visor.yaml`, sibling to the asset-only `brand`
 * block. Self-contained and engine-decoupled (D4): liftable into a future
 * `@loworbitstudio/visor-brand` package.
 */

export {
  checkBrandStrategyStructure,
  checkBrandStrategyCoherence,
  validateBrandStrategy,
} from "./validate.js";
export { serializeBrandStrategy } from "./serialize.js";

export {
  DEFAULT_BRAND_STRATEGY_TONE_STATES,
  DEFAULT_BRAND_STRATEGY_SURFACES,
  BRAND_VISIBILITIES,
  GOVERNS_WILDCARD,
} from "./types.js";

export type {
  BrandStrategy,
  BrandPositioning,
  BrandPersonalityTrait,
  BrandArchetype,
  BrandGoverns,
  BrandPillar,
  BrandVoice,
  BrandVoiceTrait,
  BrandToneEntry,
  BrandLexiconEntry,
  BrandMessaging,
  BrandBoilerplate,
  BrandColorPairing,
  BrandColorUsage,
  BrandContrastTarget,
  BrandAccessibility,
  BrandVisibility,
  SerializedBrandStrategy,
  BrandStrategyContext,
  BrandStrategyIssue,
  BrandStrategyIssueSeverity,
  BrandStrategyValidationResult,
} from "./types.js";
