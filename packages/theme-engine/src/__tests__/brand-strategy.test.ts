/**
 * Brand-strategy block tests (VI-505).
 *
 * Covers structure validation, the D2 coherence checks (governs→tokens /
 * components / surfaces; tone→UI states), manifest serialization (public vs
 * private), the composed validator, the full `validate()` integration, and the
 * two hand-maintained JSON schema copies. Visor's own authored Brand Record
 * (F1, `docs/brand/visor-brand-record.yaml`) is the primary fixture — it must
 * parse, validate, and serialize correctly (the [human] verification item).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { parse as parseYAML } from "yaml";

import {
  checkBrandStrategyStructure,
  checkBrandStrategyCoherence,
  validateBrandStrategy,
  serializeBrandStrategy,
  getKnownTokenRefs,
} from "../index.js";
import { validate } from "../validate.js";
import type { BrandStrategy } from "../index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Fixtures ────────────────────────────────────────────────

/** Visor's authored Brand Record (F1) — the canonical brand-strategy block. */
const F1: BrandStrategy = (() => {
  const path = resolvePath(__dirname, "../../../../docs/brand/visor-brand-record.yaml");
  const parsed = parseYAML(readFileSync(path, "utf-8")) as Record<string, unknown>;
  return parsed["brand-strategy"] as BrandStrategy;
})();

/** Deep clone so each test mutates an isolated copy of F1. */
function clone(value: BrandStrategy): BrandStrategy {
  return JSON.parse(JSON.stringify(value)) as BrandStrategy;
}

const KNOWN_TOKENS = getKnownTokenRefs();

// ── Structure ───────────────────────────────────────────────

describe("checkBrandStrategyStructure", () => {
  it("accepts Visor's authored Brand Record (F1)", () => {
    expect(checkBrandStrategyStructure(F1)).toEqual([]);
  });

  it("rejects a non-object", () => {
    expect(checkBrandStrategyStructure(null).length).toBeGreaterThan(0);
    expect(checkBrandStrategyStructure([]).length).toBeGreaterThan(0);
  });

  it("rejects an unknown top-level key (typo guard)", () => {
    const bad = clone(F1) as Record<string, unknown>;
    bad.positionning = {};
    const errors = checkBrandStrategyStructure(bad);
    expect(errors.some((e) => e.code === "BRAND_STRATEGY_UNKNOWN_KEY")).toBe(true);
  });

  it("requires positioning.onliness", () => {
    const bad = clone(F1);
    delete (bad.positioning as { onliness?: string }).onliness;
    const errors = checkBrandStrategyStructure(bad);
    expect(errors.some((e) => e.path === "brand-strategy.positioning.onliness")).toBe(true);
  });

  it("requires archetype.primary", () => {
    const bad = clone(F1);
    delete (bad.archetype as { primary?: string }).primary;
    const errors = checkBrandStrategyStructure(bad);
    expect(errors.some((e) => e.path === "brand-strategy.archetype.primary")).toBe(true);
  });

  it("requires each pillar.governs to declare at least one namespace", () => {
    const bad = clone(F1);
    bad.pillars[0].governs = {};
    const errors = checkBrandStrategyStructure(bad);
    expect(errors.some((e) => e.code === "BRAND_STRATEGY_GOVERNS")).toBe(true);
  });

  it("rejects an empty governs target list (governs nothing)", () => {
    const bad = clone(F1);
    bad.pillars[0].governs = { tokens: [] };
    const errors = checkBrandStrategyStructure(bad);
    expect(errors.some((e) => e.code === "BRAND_STRATEGY_GOVERNS")).toBe(true);
  });

  it("requires voice trait name/do/dont", () => {
    const bad = clone(F1);
    delete (bad.voice.traits[0] as { do?: string }).do;
    const errors = checkBrandStrategyStructure(bad);
    expect(errors.some((e) => e.code === "BRAND_STRATEGY_VOICE")).toBe(true);
  });

  it("rejects an invalid visibility", () => {
    const bad = clone(F1) as { visibility: string };
    bad.visibility = "secret";
    const errors = checkBrandStrategyStructure(bad);
    expect(errors.some((e) => e.code === "BRAND_STRATEGY_VISIBILITY")).toBe(true);
  });
});

// ── Coherence (D2) ──────────────────────────────────────────

describe("checkBrandStrategyCoherence", () => {
  it("passes F1 against the real Visor token set", () => {
    expect(checkBrandStrategyCoherence(F1, { tokens: KNOWN_TOKENS })).toEqual([]);
  });

  it("resolves the bare intent alias --primary as a real token", () => {
    // F1's `coherence` pillar governs --primary (a VI-451 bare intent alias),
    // --surface-card, and --text-primary; all must be recognized.
    expect(KNOWN_TOKENS.has("primary")).toBe(true);
    expect(KNOWN_TOKENS.has("surface-card")).toBe(true);
    expect(KNOWN_TOKENS.has("text-primary")).toBe(true);
  });

  it("fails when a pillar governs a missing token", () => {
    const bad = clone(F1);
    bad.pillars[0].governs.tokens = ["--not-a-real-token"];
    const errors = checkBrandStrategyCoherence(bad, { tokens: KNOWN_TOKENS });
    expect(errors.some((e) => e.code === "BRAND_STRATEGY_GOVERNS_TOKEN")).toBe(true);
  });

  it("accepts the `*` token wildcard", () => {
    const ok = clone(F1);
    ok.pillars[0].governs.tokens = ["*"];
    expect(checkBrandStrategyCoherence(ok, { tokens: KNOWN_TOKENS })).toEqual([]);
  });

  it("fails when a tone key is not a recognized UI state", () => {
    const bad = clone(F1);
    bad.tone.explosion = { feeling: "loud", example: "boom" };
    const errors = checkBrandStrategyCoherence(bad, { tokens: KNOWN_TOKENS });
    expect(errors.some((e) => e.code === "BRAND_STRATEGY_TONE_STATE")).toBe(true);
  });

  it("fails when a pillar governs an unrecognized surface", () => {
    const bad = clone(F1);
    bad.pillars[1].governs.surfaces = ["nonsense-surface"];
    const errors = checkBrandStrategyCoherence(bad, { tokens: KNOWN_TOKENS });
    expect(errors.some((e) => e.code === "BRAND_STRATEGY_GOVERNS_SURFACE")).toBe(true);
  });

  it("checks named components only when a component set is injected", () => {
    const s = clone(F1);
    s.pillars[2].governs.components = ["button", "ghost-widget"];
    // No component set → named components pass (engine package boundary).
    expect(checkBrandStrategyCoherence(s, { tokens: KNOWN_TOKENS })).toEqual([]);
    // With a component set → the unknown component fails.
    const errors = checkBrandStrategyCoherence(s, {
      tokens: KNOWN_TOKENS,
      components: new Set(["button"]),
    });
    expect(errors.some((e) => e.code === "BRAND_STRATEGY_GOVERNS_COMPONENT")).toBe(true);
  });

  it("skips token coherence when no token set is provided", () => {
    const s = clone(F1);
    s.pillars[0].governs.tokens = ["--anything-goes"];
    expect(checkBrandStrategyCoherence(s, {})).toEqual([]);
  });
});

// ── Serialization (D3) ──────────────────────────────────────

describe("serializeBrandStrategy", () => {
  it("serializes a public record with voice + tone + pillars intact", () => {
    const serialized = serializeBrandStrategy(F1);
    expect(serialized).not.toBeNull();
    const s = serialized as BrandStrategy;
    expect(s.voice.traits.map((t) => t.name)).toContain("plainspoken");
    expect(s.tone.error.feeling.length).toBeGreaterThan(0);
    expect(s.pillars.map((p) => p.id)).toEqual(["coherence", "openness", "ownership"]);
  });

  it("returns null for a private record (never enters the public manifest)", () => {
    const priv = clone(F1);
    priv.visibility = "private";
    expect(serializeBrandStrategy(priv)).toBeNull();
  });

  it("omits absent optional governs lists", () => {
    const s = serializeBrandStrategy(F1) as BrandStrategy;
    const openness = s.pillars.find((p) => p.id === "openness");
    expect(openness?.governs.tokens).toBeUndefined();
    expect(openness?.governs.surfaces).toEqual(["manifest", "cli", "component-metadata"]);
  });
});

// ── Composed validator ──────────────────────────────────────

describe("validateBrandStrategy", () => {
  it("returns valid for F1", () => {
    const result = validateBrandStrategy(F1, { tokens: KNOWN_TOKENS });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("short-circuits on structural errors (no coherence run)", () => {
    const result = validateBrandStrategy(null, { tokens: KNOWN_TOKENS });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ── Full theme validate() integration ───────────────────────

describe("validate() with a brand-strategy block", () => {
  const baseTheme = { name: "test", version: 1, colors: { primary: "#2563EB" } };

  it("passes a theme carrying a valid brand-strategy", () => {
    const result = validate({ ...baseTheme, "brand-strategy": F1 });
    expect(result.errors.filter((e) => e.code.startsWith("BRAND_STRATEGY"))).toEqual([]);
  });

  it("surfaces a coherence error (governs a missing token)", () => {
    const bad = clone(F1);
    bad.pillars[0].governs.tokens = ["--ghost-token"];
    const result = validate({ ...baseTheme, "brand-strategy": bad });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "BRAND_STRATEGY_GOVERNS_TOKEN")).toBe(true);
  });

  it("surfaces a structural error (bad visibility) via the structural pass", () => {
    const bad = clone(F1) as { visibility: string };
    bad.visibility = "secret";
    const result = validate({ ...baseTheme, "brand-strategy": bad });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("visibility"))).toBe(true);
  });
});

// ── JSON schema copies ──────────────────────────────────────

describe("visor-theme.schema.json brand-strategy block", () => {
  const enginePath = resolvePath(__dirname, "../visor-theme.schema.json");
  const docsPath = resolvePath(__dirname, "../../../../docs/visor-theme.schema.json");

  it("both copies declare the brand-strategy property and its $defs", () => {
    for (const path of [enginePath, docsPath]) {
      const schema = JSON.parse(readFileSync(path, "utf-8")) as {
        properties: Record<string, unknown>;
        $defs: Record<string, unknown>;
      };
      expect(schema.properties["brand-strategy"]).toBeDefined();
      expect(schema.$defs.brandPillar).toBeDefined();
      expect(schema.$defs.brandGoverns).toBeDefined();
      expect(schema.$defs.brandVoiceTrait).toBeDefined();
    }
  });

  it("the two copies are byte-identical (VI-502 contract)", () => {
    expect(readFileSync(enginePath, "utf-8")).toBe(readFileSync(docsPath, "utf-8"));
  });
});
