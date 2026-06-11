/**
 * Brand-strategy validation (VI-505) — pure, engine-decoupled (D4).
 *
 * Two layers:
 *  - {@link checkBrandStrategyStructure}: shape, types, required fields, enums.
 *    No external context — catches malformed records.
 *  - {@link checkBrandStrategyCoherence}: the D2 links — every `governs` target
 *    resolves to a real token/component/surface, and every `tone` key maps to a
 *    real UI state. The real-world sets are INJECTED via {@link BrandStrategyContext}
 *    so this file never imports the engine's token map (keeps it liftable).
 *
 * {@link validateBrandStrategy} composes both into a structured result.
 */

import {
  type BrandStrategy,
  type BrandStrategyContext,
  type BrandStrategyIssue,
  type BrandStrategyValidationResult,
  BRAND_VISIBILITIES,
  DEFAULT_BRAND_STRATEGY_SURFACES,
  DEFAULT_BRAND_STRATEGY_TONE_STATES,
  GOVERNS_WILDCARD,
} from "./types.js";

// ============================================================
// Helpers
// ============================================================

function error(code: string, message: string, path?: string): BrandStrategyIssue {
  const issue: BrandStrategyIssue = { severity: "error", code, message };
  if (path !== undefined) issue.path = path;
  return issue;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/** Strip a single leading `--` so `--primary` and `primary` compare equal. */
function normalizeTokenRef(ref: string): string {
  return ref.startsWith("--") ? ref.slice(2) : ref;
}

// ============================================================
// Structural validation
// ============================================================

const TOP_LEVEL_KEYS = new Set([
  "positioning",
  "essence",
  "personality",
  "archetype",
  "pillars",
  "voice",
  "tone",
  "lexicon",
  "core",
  "visibility",
  // Phase 2 wave-1 (VI-541) — all optional.
  "messaging",
  "taglines",
  "boilerplate",
  "colorUsage",
  "accessibility",
]);

const GOVERNS_KEYS = new Set(["tokens", "components", "surfaces"]);

/**
 * Validate the shape of a `brand-strategy` block. Returns an error per problem
 * (empty array = structurally valid). All ten top-level fields are required.
 */
export function checkBrandStrategyStructure(block: unknown): BrandStrategyIssue[] {
  const errors: BrandStrategyIssue[] = [];

  if (!isObject(block)) {
    errors.push(error("BRAND_STRATEGY_STRUCTURAL", "'brand-strategy' must be an object", "brand-strategy"));
    return errors;
  }

  // Unknown top-level keys (catches typos like `positionning`).
  for (const key of Object.keys(block)) {
    if (!TOP_LEVEL_KEYS.has(key)) {
      errors.push(
        error(
          "BRAND_STRATEGY_UNKNOWN_KEY",
          `Unknown key 'brand-strategy.${key}'. Valid keys: ${[...TOP_LEVEL_KEYS].join(", ")}`,
          `brand-strategy.${key}`,
        ),
      );
    }
  }

  // positioning
  const positioning = block.positioning;
  if (!isObject(positioning)) {
    errors.push(error("BRAND_STRATEGY_POSITIONING", "'brand-strategy.positioning' is required and must be an object", "brand-strategy.positioning"));
  } else {
    for (const field of ["onliness", "category", "differentiation"] as const) {
      if (!isNonEmptyString(positioning[field])) {
        errors.push(error("BRAND_STRATEGY_POSITIONING", `'brand-strategy.positioning.${field}' is required and must be a non-empty string`, `brand-strategy.positioning.${field}`));
      }
    }
  }

  // essence
  if (!isStringArray(block.essence) || block.essence.length === 0) {
    errors.push(error("BRAND_STRATEGY_ESSENCE", "'brand-strategy.essence' is required and must be a non-empty array of strings", "brand-strategy.essence"));
  }

  // personality
  if (!Array.isArray(block.personality) || block.personality.length === 0) {
    errors.push(error("BRAND_STRATEGY_PERSONALITY", "'brand-strategy.personality' is required and must be a non-empty array", "brand-strategy.personality"));
  } else {
    block.personality.forEach((trait, i) => {
      if (!isObject(trait) || !isNonEmptyString(trait.trait) || !isNonEmptyString(trait.not)) {
        errors.push(error("BRAND_STRATEGY_PERSONALITY", `'brand-strategy.personality[${i}]' must have non-empty 'trait' and 'not' strings`, `brand-strategy.personality[${i}]`));
      }
    });
  }

  // archetype
  const archetype = block.archetype;
  if (!isObject(archetype)) {
    errors.push(error("BRAND_STRATEGY_ARCHETYPE", "'brand-strategy.archetype' is required and must be an object", "brand-strategy.archetype"));
  } else {
    if (!isNonEmptyString(archetype.primary)) {
      errors.push(error("BRAND_STRATEGY_ARCHETYPE", "'brand-strategy.archetype.primary' is required and must be a non-empty string", "brand-strategy.archetype.primary"));
    }
    for (const field of ["secondary", "tertiary"] as const) {
      if (archetype[field] !== undefined && !isNonEmptyString(archetype[field])) {
        errors.push(error("BRAND_STRATEGY_ARCHETYPE", `'brand-strategy.archetype.${field}' must be a non-empty string when present`, `brand-strategy.archetype.${field}`));
      }
    }
  }

  // pillars
  if (!Array.isArray(block.pillars) || block.pillars.length === 0) {
    errors.push(error("BRAND_STRATEGY_PILLARS", "'brand-strategy.pillars' is required and must be a non-empty array", "brand-strategy.pillars"));
  } else {
    block.pillars.forEach((pillar, i) => {
      errors.push(...checkPillarStructure(pillar, i));
    });
  }

  // voice
  const voice = block.voice;
  if (!isObject(voice) || !Array.isArray(voice.traits) || voice.traits.length === 0) {
    errors.push(error("BRAND_STRATEGY_VOICE", "'brand-strategy.voice' is required and must have a non-empty 'traits' array", "brand-strategy.voice"));
  } else {
    voice.traits.forEach((trait, i) => {
      if (
        !isObject(trait) ||
        !isNonEmptyString(trait.name) ||
        !isNonEmptyString(trait.do) ||
        !isNonEmptyString(trait.dont)
      ) {
        errors.push(error("BRAND_STRATEGY_VOICE", `'brand-strategy.voice.traits[${i}]' must have non-empty 'name', 'do', and 'dont' strings`, `brand-strategy.voice.traits[${i}]`));
      } else if (trait.example !== undefined && !isNonEmptyString(trait.example)) {
        errors.push(error("BRAND_STRATEGY_VOICE", `'brand-strategy.voice.traits[${i}].example' must be a non-empty string when present`, `brand-strategy.voice.traits[${i}].example`));
      }
    });
  }

  // tone
  const tone = block.tone;
  if (!isObject(tone) || Object.keys(tone).length === 0) {
    errors.push(error("BRAND_STRATEGY_TONE", "'brand-strategy.tone' is required and must be a non-empty object keyed by UI state", "brand-strategy.tone"));
  } else {
    for (const [state, entry] of Object.entries(tone)) {
      if (!isObject(entry) || !isNonEmptyString(entry.feeling) || !isNonEmptyString(entry.example)) {
        errors.push(error("BRAND_STRATEGY_TONE", `'brand-strategy.tone.${state}' must have non-empty 'feeling' and 'example' strings`, `brand-strategy.tone.${state}`));
      }
    }
  }

  // lexicon
  if (!Array.isArray(block.lexicon) || block.lexicon.length === 0) {
    errors.push(error("BRAND_STRATEGY_LEXICON", "'brand-strategy.lexicon' is required and must be a non-empty array", "brand-strategy.lexicon"));
  } else {
    block.lexicon.forEach((entry, i) => {
      if (!isObject(entry) || !isNonEmptyString(entry.use) || !isNonEmptyString(entry.avoid)) {
        errors.push(error("BRAND_STRATEGY_LEXICON", `'brand-strategy.lexicon[${i}]' must have non-empty 'use' and 'avoid' strings`, `brand-strategy.lexicon[${i}]`));
      }
    });
  }

  // core
  if (!isStringArray(block.core) || block.core.length === 0) {
    errors.push(error("BRAND_STRATEGY_CORE", "'brand-strategy.core' is required and must be a non-empty array of strings", "brand-strategy.core"));
  }

  // visibility
  if (!isNonEmptyString(block.visibility) || !(BRAND_VISIBILITIES as readonly string[]).includes(block.visibility)) {
    errors.push(error("BRAND_STRATEGY_VISIBILITY", `'brand-strategy.visibility' is required and must be one of: ${BRAND_VISIBILITIES.join(", ")}`, "brand-strategy.visibility"));
  }

  // Phase 2 wave-1 (VI-541) — all optional; validated only when present.
  errors.push(...checkPhase2Structure(block));

  return errors;
}

// ============================================================
// Phase 2 wave-1 structural validation (VI-541)
// ============================================================

/**
 * Validate the Phase 2 wave-1 fields (`messaging`, `taglines`, `boilerplate`,
 * `colorUsage`, `accessibility`). Each is OPTIONAL — a record may omit any of
 * them — so a field is checked only when present. When present, its shape must
 * be complete (mirrors the Phase 1 required-field rigor).
 */
function checkPhase2Structure(block: Record<string, unknown>): BrandStrategyIssue[] {
  const errors: BrandStrategyIssue[] = [];

  // messaging — { roof: non-empty string }
  if (block.messaging !== undefined) {
    const messaging = block.messaging;
    if (!isObject(messaging) || !isNonEmptyString(messaging.roof)) {
      errors.push(error("BRAND_STRATEGY_MESSAGING", "'brand-strategy.messaging' must be an object with a non-empty 'roof' string", "brand-strategy.messaging"));
    }
  }

  // taglines — non-empty array of non-empty strings
  if (block.taglines !== undefined) {
    if (!isStringArray(block.taglines) || block.taglines.length === 0) {
      errors.push(error("BRAND_STRATEGY_TAGLINES", "'brand-strategy.taglines' must be a non-empty array of strings when present", "brand-strategy.taglines"));
    } else if (!block.taglines.every(isNonEmptyString)) {
      errors.push(error("BRAND_STRATEGY_TAGLINES", "'brand-strategy.taglines' entries must be non-empty strings", "brand-strategy.taglines"));
    }
  }

  // boilerplate — { short, long } both non-empty strings
  if (block.boilerplate !== undefined) {
    const boilerplate = block.boilerplate;
    if (!isObject(boilerplate) || !isNonEmptyString(boilerplate.short) || !isNonEmptyString(boilerplate.long)) {
      errors.push(error("BRAND_STRATEGY_BOILERPLATE", "'brand-strategy.boilerplate' must be an object with non-empty 'short' and 'long' strings", "brand-strategy.boilerplate"));
    }
  }

  // colorUsage — { pairings: { use, with, rule }[] }
  if (block.colorUsage !== undefined) {
    const colorUsage = block.colorUsage;
    if (!isObject(colorUsage) || !Array.isArray(colorUsage.pairings) || colorUsage.pairings.length === 0) {
      errors.push(error("BRAND_STRATEGY_COLOR_USAGE", "'brand-strategy.colorUsage' must be an object with a non-empty 'pairings' array", "brand-strategy.colorUsage"));
    } else {
      colorUsage.pairings.forEach((pairing, i) => {
        if (!isObject(pairing) || !isNonEmptyString(pairing.use) || !isNonEmptyString(pairing.with) || !isNonEmptyString(pairing.rule)) {
          errors.push(error("BRAND_STRATEGY_COLOR_USAGE", `'brand-strategy.colorUsage.pairings[${i}]' must have non-empty 'use', 'with', and 'rule' strings`, `brand-strategy.colorUsage.pairings[${i}]`));
        }
      });
    }
  }

  // accessibility — { standard, contrast: { context, ratio }[], intent }
  if (block.accessibility !== undefined) {
    const accessibility = block.accessibility;
    if (!isObject(accessibility)) {
      errors.push(error("BRAND_STRATEGY_ACCESSIBILITY", "'brand-strategy.accessibility' must be an object", "brand-strategy.accessibility"));
    } else {
      if (!isNonEmptyString(accessibility.standard)) {
        errors.push(error("BRAND_STRATEGY_ACCESSIBILITY", "'brand-strategy.accessibility.standard' is required and must be a non-empty string", "brand-strategy.accessibility.standard"));
      }
      if (!isNonEmptyString(accessibility.intent)) {
        errors.push(error("BRAND_STRATEGY_ACCESSIBILITY", "'brand-strategy.accessibility.intent' is required and must be a non-empty string", "brand-strategy.accessibility.intent"));
      }
      if (!Array.isArray(accessibility.contrast) || accessibility.contrast.length === 0) {
        errors.push(error("BRAND_STRATEGY_ACCESSIBILITY", "'brand-strategy.accessibility.contrast' must be a non-empty array", "brand-strategy.accessibility.contrast"));
      } else {
        accessibility.contrast.forEach((target, i) => {
          if (!isObject(target) || !isNonEmptyString(target.context) || !isNonEmptyString(target.ratio)) {
            errors.push(error("BRAND_STRATEGY_ACCESSIBILITY", `'brand-strategy.accessibility.contrast[${i}]' must have non-empty 'context' and 'ratio' strings`, `brand-strategy.accessibility.contrast[${i}]`));
          }
        });
      }
    }
  }

  return errors;
}

function checkPillarStructure(pillar: unknown, index: number): BrandStrategyIssue[] {
  const path = `brand-strategy.pillars[${index}]`;
  if (!isObject(pillar)) {
    return [error("BRAND_STRATEGY_PILLARS", `'${path}' must be an object`, path)];
  }
  const errors: BrandStrategyIssue[] = [];
  if (!isNonEmptyString(pillar.id)) {
    errors.push(error("BRAND_STRATEGY_PILLARS", `'${path}.id' is required and must be a non-empty string`, `${path}.id`));
  }
  if (!isNonEmptyString(pillar.statement)) {
    errors.push(error("BRAND_STRATEGY_PILLARS", `'${path}.statement' is required and must be a non-empty string`, `${path}.statement`));
  }
  const governs = pillar.governs;
  if (!isObject(governs)) {
    errors.push(error("BRAND_STRATEGY_PILLARS", `'${path}.governs' is required and must be an object`, `${path}.governs`));
  } else {
    for (const key of Object.keys(governs)) {
      if (!GOVERNS_KEYS.has(key)) {
        errors.push(error("BRAND_STRATEGY_GOVERNS", `Unknown key '${path}.governs.${key}'. Valid keys: ${[...GOVERNS_KEYS].join(", ")}`, `${path}.governs.${key}`));
      }
    }
    // Each declared target list must be a NON-EMPTY string array. An empty
    // list governs nothing, which the "at least one namespace" guard below
    // would otherwise miss (an empty array is truthy).
    for (const key of GOVERNS_KEYS) {
      const list = governs[key];
      if (list === undefined) continue;
      if (!isStringArray(list)) {
        errors.push(error("BRAND_STRATEGY_GOVERNS", `'${path}.governs.${key}' must be an array of strings`, `${path}.governs.${key}`));
      } else if (list.length === 0) {
        errors.push(error("BRAND_STRATEGY_GOVERNS", `'${path}.governs.${key}' must not be empty when present`, `${path}.governs.${key}`));
      }
    }
    if (governs.tokens === undefined && governs.components === undefined && governs.surfaces === undefined) {
      errors.push(error("BRAND_STRATEGY_GOVERNS", `'${path}.governs' must declare at least one of: ${[...GOVERNS_KEYS].join(", ")}`, `${path}.governs`));
    }
  }
  // proof (VI-541) — optional reasons-to-believe. When present it must be a
  // non-empty array of non-empty strings.
  if (pillar.proof !== undefined) {
    if (!isStringArray(pillar.proof) || pillar.proof.length === 0) {
      errors.push(error("BRAND_STRATEGY_PROOF", `'${path}.proof' must be a non-empty array of strings when present`, `${path}.proof`));
    } else if (!pillar.proof.every(isNonEmptyString)) {
      errors.push(error("BRAND_STRATEGY_PROOF", `'${path}.proof' entries must be non-empty strings`, `${path}.proof`));
    }
  }
  return errors;
}

// ============================================================
// Coherence validation (D2)
// ============================================================

/**
 * Check the D2 links of a structurally-valid strategy: every `governs` target
 * resolves to a real token/component/surface, and every `tone` key maps to a
 * real UI state. Unknown links are errors — coherence drift fails the build the
 * way token drift does.
 *
 * Each namespace is checked only when the caller supplies the matching set:
 *  - `ctx.tokens` absent → token refs are not checked (the engine always
 *    supplies it; a bare structural caller may not).
 *  - `ctx.components` absent → only `"*"` is accepted for components (the engine
 *    has no registry access; tests inject a set to exercise the named path).
 *  - `ctx.surfaces` / `ctx.states` default to the recognized sets.
 */
export function checkBrandStrategyCoherence(
  strategy: BrandStrategy,
  ctx: BrandStrategyContext = {},
): BrandStrategyIssue[] {
  const errors: BrandStrategyIssue[] = [];
  const surfaces = ctx.surfaces ?? new Set(DEFAULT_BRAND_STRATEGY_SURFACES);
  const states = ctx.states ?? new Set(DEFAULT_BRAND_STRATEGY_TONE_STATES);

  strategy.pillars.forEach((pillar, i) => {
    const path = `brand-strategy.pillars[${i}].governs`;

    if (ctx.tokens && pillar.governs.tokens) {
      for (const ref of pillar.governs.tokens) {
        if (ref === GOVERNS_WILDCARD) continue;
        if (!ctx.tokens.has(normalizeTokenRef(ref))) {
          errors.push(error("BRAND_STRATEGY_GOVERNS_TOKEN", `Pillar '${pillar.id}' governs token '${ref}', which is not a known Visor token`, `${path}.tokens`));
        }
      }
    }

    if (pillar.governs.components) {
      for (const ref of pillar.governs.components) {
        if (ref === GOVERNS_WILDCARD) continue;
        if (ctx.components && !ctx.components.has(ref)) {
          errors.push(error("BRAND_STRATEGY_GOVERNS_COMPONENT", `Pillar '${pillar.id}' governs component '${ref}', which is not a known Visor component`, `${path}.components`));
        }
      }
    }

    if (pillar.governs.surfaces) {
      for (const ref of pillar.governs.surfaces) {
        if (!surfaces.has(ref)) {
          errors.push(error("BRAND_STRATEGY_GOVERNS_SURFACE", `Pillar '${pillar.id}' governs surface '${ref}', which is not a recognized meta-surface (${[...surfaces].join(", ")})`, `${path}.surfaces`));
        }
      }
    }
  });

  for (const state of Object.keys(strategy.tone)) {
    if (!states.has(state)) {
      errors.push(error("BRAND_STRATEGY_TONE_STATE", `tone key '${state}' does not map to a recognized UI state (${[...states].join(", ")})`, `brand-strategy.tone.${state}`));
    }
  }

  return errors;
}

// ============================================================
// Composed entry point
// ============================================================

/**
 * Validate a `brand-strategy` block end to end: structure first, then (only if
 * structurally valid) coherence against the injected context. Coherence
 * findings inherit their severity (errors block; warnings don't).
 */
export function validateBrandStrategy(
  block: unknown,
  ctx: BrandStrategyContext = {},
): BrandStrategyValidationResult {
  const errors = checkBrandStrategyStructure(block);
  const warnings: BrandStrategyIssue[] = [];

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  for (const issue of checkBrandStrategyCoherence(block as BrandStrategy, ctx)) {
    (issue.severity === "error" ? errors : warnings).push(issue);
  }

  return { valid: errors.length === 0, errors, warnings };
}
