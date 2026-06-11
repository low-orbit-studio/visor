/**
 * Brand-strategy types for the Visor theme engine (VI-505).
 *
 * The Brand Record as validated, serializable, theme-aware data — a top-level
 * `brand-strategy` block in `.visor.yaml`, SIBLING to the asset-only `brand`
 * block (`packages/theme-engine/src/brand/`). The two have different lifecycles
 * and consumers: `brand` declares logo/wordmark/etc. assets; `brand-strategy`
 * declares positioning, personality, pillars, voice, and tone.
 *
 * Shape follows F1 — Visor's authored Brand Record
 * (`docs/brand/visor-brand-record.yaml`) — itself derived from the VI-498
 * research sketch (§5a).
 *
 * This module is deliberately self-contained and engine-decoupled (D4): the
 * types, the pure validators (coherence context is injected, never imported),
 * and the serializer lift cleanly into a future `@loworbitstudio/visor-brand`
 * package. Engine-specific wiring (the known-token set, the comprehensive
 * `validate()` pass, the manifest serialization call-site) lives outside.
 */

/** Positioning — the onliness, category, and differentiation wedge. */
export interface BrandPositioning {
  /** The single sentence that passes Neumeier's "only" test. */
  onliness: string;
  /** The category the brand competes in (e.g. "design system"). */
  category: string;
  /** What sets the brand apart within that category. */
  differentiation: string;
}

/** A personality trait sharpened by its antonym (brand-as-person). */
export interface BrandPersonalityTrait {
  /** The trait (e.g. "precise"). */
  trait: string;
  /** What the trait is NOT — the antonym that earns it its keep (e.g. "fussy"). */
  not: string;
}

/**
 * Brand archetype assignment (Pearson & Mark — twelve archetypes). Primary is
 * required; secondary and tertiary are optional refinements.
 */
export interface BrandArchetype {
  primary: string;
  secondary?: string;
  tertiary?: string;
}

/**
 * What a pillar governs — the link that turns a slogan into a checkable claim.
 * Targets span three namespaces: design tokens, registry components, and
 * meta-surfaces (the manifest, the CLI, component metadata). The `openness`
 * pillar governs the last of these, which is why `governs` accepts more than
 * tokens/components (F1 schema note). At least one target list is expected.
 */
export interface BrandGoverns {
  /** Semantic token refs (with or without the leading `--`), or `"*"` for all. */
  tokens?: string[];
  /** Registry component names, or `"*"` for all. */
  components?: string[];
  /** Meta-surfaces (e.g. `manifest`, `cli`, `component-metadata`). */
  surfaces?: string[];
}

/** A strategic pillar — an essence word made operational. */
export interface BrandPillar {
  /** Stable id (e.g. "coherence"). */
  id: string;
  /** The pillar's claim in one line. */
  statement: string;
  /** What the pillar governs (coherence-checked against the live system). */
  governs: BrandGoverns;
  /**
   * Reasons-to-believe — the message-house foundation (VI-541, Phase 2 wave-1).
   * Concrete, checkable evidence backing this pillar's claim. Optional so a
   * record can carry pillars without proof points.
   */
  proof?: string[];
}

/** A fixed voice trait with a worked example. */
export interface BrandVoiceTrait {
  /** Trait name (e.g. "plainspoken"). */
  name: string;
  /** What to do. */
  do: string;
  /** What not to do. */
  dont: string;
  /** A worked example sentence (F1 carries one on every trait). */
  example?: string;
}

/** Voice — fixed across the brand; never flexes. */
export interface BrandVoice {
  traits: BrandVoiceTrait[];
}

/** A single tone entry, keyed (in `tone`) to a recognized UI state. */
export interface BrandToneEntry {
  /** The feeling the copy should evoke in this state. */
  feeling: string;
  /** A worked example message for this state. */
  example: string;
}

/** A lexicon pairing — the word to use and the one to avoid. */
export interface BrandLexiconEntry {
  use: string;
  avoid: string;
}

// ── Phase 2 wave-1 (VI-541): messaging house, taglines/boilerplate, color-usage. ──

/** Message-house roof — the single umbrella message above the pillars. */
export interface BrandMessaging {
  /** One overarching statement the pillars support (message-house roof). */
  roof: string;
}

/** Reusable "about us" copy — short and long forms. */
export interface BrandBoilerplate {
  short: string;
  long: string;
}

/** A color-pairing rule expressed as brand intent (not a computed value). */
export interface BrandColorPairing {
  /** The token or role being used (e.g. `--primary`). */
  use: string;
  /** What it pairs against (token, role, or surface). */
  with: string;
  /** The intent — when and how the pairing is allowed. */
  rule: string;
}

/** Color-usage intent — the brand's allowed pairings. */
export interface BrandColorUsage {
  pairings: BrandColorPairing[];
}

/** A contrast target expressed as brand intent (a WCAG 2.1 AA threshold). */
export interface BrandContrastTarget {
  /** The text/UI context the target applies to. */
  context: string;
  /** The minimum contrast ratio (e.g. "4.5:1"). */
  ratio: string;
}

/** Accessibility intent — the standard and its contrast targets. */
export interface BrandAccessibility {
  /** The conformance standard. Visor targets "WCAG 2.1 AA". */
  standard: string;
  /** WCAG 2.1 AA contrast targets, authored as intent (live computation is the render surface's concern). */
  contrast: BrandContrastTarget[];
  /** How the brand applies the standard (intent, not computed results). */
  intent: string;
}

/** Visibility of a brand strategy. Client brands are `private`. */
export type BrandVisibility = "public" | "private";

/**
 * The `brand-strategy` block — strategy + verbal identity as data.
 *
 * `tone` is keyed by UI state (`error`, `success`, …); the keys are validated
 * against the recognized UI states (coherence check D2). The ten Phase 1 fields
 * are required in v1 — F1 authors the full record, and the downstream Workbench
 * surfaces render each section. The Phase 2 wave-1 fields (`messaging`,
 * `taglines`, `boilerplate`, `colorUsage`, `accessibility`; VI-541) are optional
 * so a record — e.g. a private client brand — can omit them.
 */
export interface BrandStrategy {
  positioning: BrandPositioning;
  /** 2–3 internal-facing core words (Aaker essence). */
  essence: string[];
  personality: BrandPersonalityTrait[];
  archetype: BrandArchetype;
  pillars: BrandPillar[];
  voice: BrandVoice;
  /** Voice flexed per UI state. Keys ∈ recognized UI states. */
  tone: Record<string, BrandToneEntry>;
  lexicon: BrandLexiconEntry[];
  /** Aaker core/extended — the immutable subset, as section names. */
  core: string[];
  visibility: BrandVisibility;
  // ── Phase 2 wave-1 (VI-541) — optional; see the interfaces above. ──
  /** Message-house roof — the umbrella message above the pillars. */
  messaging?: BrandMessaging;
  /** Permanent, brand-level signature line(s) — who the brand is, not what it sells this quarter. */
  taglines?: string[];
  /** Reusable "about us" copy — short and long forms. */
  boilerplate?: BrandBoilerplate;
  /** Color-usage intent — the brand's allowed pairings. */
  colorUsage?: BrandColorUsage;
  /** Accessibility intent — WCAG 2.1 AA standard + contrast targets. */
  accessibility?: BrandAccessibility;
}

/**
 * The agent-facing projection of a brand strategy, embedded in
 * `visor-manifest.json` under `brand_strategy` (D3). Structurally identical to
 * the authored shape so an agent reads `voice.traits` / `tone.error` the way it
 * reads a component's `when_to_use`. Only PUBLIC strategies are serialized.
 */
export type SerializedBrandStrategy = BrandStrategy;

/** Recognized UI states a `tone` key may target (coherence check D2). */
export const DEFAULT_BRAND_STRATEGY_TONE_STATES: readonly string[] = [
  "error",
  "success",
  "warning",
  "info",
  "empty",
  "loading",
  "validation-warning",
];

/** Recognized meta-surfaces a pillar may govern (coherence check D2). */
export const DEFAULT_BRAND_STRATEGY_SURFACES: readonly string[] = [
  "manifest",
  "cli",
  "component-metadata",
];

/** Valid `visibility` values. */
export const BRAND_VISIBILITIES: readonly BrandVisibility[] = ["public", "private"];

/** Wildcard accepted in any `governs` target list — matches all of that namespace. */
export const GOVERNS_WILDCARD = "*";

export type BrandStrategyIssueSeverity = "error" | "warning";

/** A single validation finding. Mirrors the engine's `ValidationIssue` shape. */
export interface BrandStrategyIssue {
  severity: BrandStrategyIssueSeverity;
  code: string;
  message: string;
  path?: string;
}

/** Structured validation result for a brand-strategy block. */
export interface BrandStrategyValidationResult {
  valid: boolean;
  errors: BrandStrategyIssue[];
  warnings: BrandStrategyIssue[];
}

/**
 * Coherence context — the real-world sets a strategy's links are checked
 * against. Injected by the caller (the engine `validate()` pass, the manifest
 * builder, or a test) so the validator stays pure and engine-decoupled (D4).
 */
export interface BrandStrategyContext {
  /** Known semantic token names WITHOUT the leading `--` (e.g. "primary", "surface-card"). When omitted, token coherence is skipped. */
  tokens?: ReadonlySet<string>;
  /** Known registry component names. When omitted, only `"*"` is accepted for components. */
  components?: ReadonlySet<string>;
  /** Recognized meta-surfaces. Defaults to {@link DEFAULT_BRAND_STRATEGY_SURFACES}. */
  surfaces?: ReadonlySet<string>;
  /** Recognized UI states for `tone` keys. Defaults to {@link DEFAULT_BRAND_STRATEGY_TONE_STATES}. */
  states?: ReadonlySet<string>;
}
