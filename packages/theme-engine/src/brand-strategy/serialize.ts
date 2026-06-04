/**
 * Brand-strategy serialization (VI-505, D3).
 *
 * Projects a validated strategy into its agent-manifest form
 * (`visor-manifest.json` → `brand_strategy`). The projection mirrors the
 * authored shape so an agent reads `voice.traits` / `tone.error` the way it
 * reads a component's `when_to_use`.
 *
 * PRIVACY: a `private` strategy (client brands) returns `null` and is never
 * written to the public manifest. The caller omits the field when null.
 */

import type {
  BrandGoverns,
  BrandStrategy,
  SerializedBrandStrategy,
} from "./types.js";

/** Copy `governs`, keeping only the target lists that are actually present. */
function compactGoverns(governs: BrandGoverns): BrandGoverns {
  const out: BrandGoverns = {};
  if (governs.tokens) out.tokens = [...governs.tokens];
  if (governs.components) out.components = [...governs.components];
  if (governs.surfaces) out.surfaces = [...governs.surfaces];
  return out;
}

/**
 * Serialize a validated brand strategy for the manifest. Returns `null` when
 * `visibility: private`. Optional fields (`archetype.secondary`,
 * `voice.traits[].example`, absent `governs` lists) are emitted only when
 * present, so the agent reads a clean, predictable object.
 */
export function serializeBrandStrategy(
  strategy: BrandStrategy,
): SerializedBrandStrategy | null {
  if (strategy.visibility === "private") {
    return null;
  }

  const archetype: SerializedBrandStrategy["archetype"] = { primary: strategy.archetype.primary };
  if (strategy.archetype.secondary !== undefined) archetype.secondary = strategy.archetype.secondary;
  if (strategy.archetype.tertiary !== undefined) archetype.tertiary = strategy.archetype.tertiary;

  const tone: SerializedBrandStrategy["tone"] = {};
  for (const [state, entry] of Object.entries(strategy.tone)) {
    tone[state] = { feeling: entry.feeling, example: entry.example };
  }

  return {
    positioning: {
      onliness: strategy.positioning.onliness,
      category: strategy.positioning.category,
      differentiation: strategy.positioning.differentiation,
    },
    essence: [...strategy.essence],
    personality: strategy.personality.map((p) => ({ trait: p.trait, not: p.not })),
    archetype,
    pillars: strategy.pillars.map((p) => ({
      id: p.id,
      statement: p.statement,
      governs: compactGoverns(p.governs),
    })),
    voice: {
      traits: strategy.voice.traits.map((t) => {
        const trait: SerializedBrandStrategy["voice"]["traits"][number] = {
          name: t.name,
          do: t.do,
          dont: t.dont,
        };
        if (t.example !== undefined) trait.example = t.example;
        return trait;
      }),
    },
    tone,
    lexicon: strategy.lexicon.map((l) => ({ use: l.use, avoid: l.avoid })),
    core: [...strategy.core],
    visibility: strategy.visibility,
  };
}
