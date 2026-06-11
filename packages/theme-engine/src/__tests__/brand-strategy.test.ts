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

// ── Phase 2 wave-1 (VI-541): messaging, taglines/boilerplate, color-usage ──

describe("brand-strategy Phase 2 wave-1 fields", () => {
  it("F1 carries the authored Phase 2 fields (proof, messaging, taglines, boilerplate, colorUsage, accessibility)", () => {
    expect(F1.messaging?.roof.length).toBeGreaterThan(0);
    expect(F1.taglines?.length).toBeGreaterThan(0);
    expect(F1.boilerplate?.short.length).toBeGreaterThan(0);
    expect(F1.boilerplate?.long.length).toBeGreaterThan(0);
    expect(F1.colorUsage?.pairings.length).toBeGreaterThan(0);
    expect(F1.accessibility?.standard).toBe("WCAG 2.1 AA");
    for (const pillar of F1.pillars) {
      expect(pillar.proof?.length).toBeGreaterThan(0);
    }
  });

  it("validates clean (structure + coherence) with the Phase 2 fields present", () => {
    expect(checkBrandStrategyStructure(F1)).toEqual([]);
    expect(checkBrandStrategyCoherence(F1, { tokens: KNOWN_TOKENS })).toEqual([]);
  });

  it("treats every Phase 2 field as OPTIONAL (a record may omit all of them)", () => {
    const lean = clone(F1) as Record<string, unknown>;
    delete lean.messaging;
    delete lean.taglines;
    delete lean.boilerplate;
    delete lean.colorUsage;
    delete lean.accessibility;
    for (const pillar of (lean.pillars as { proof?: string[] }[])) delete pillar.proof;
    expect(checkBrandStrategyStructure(lean)).toEqual([]);
  });

  it("rejects messaging without a roof", () => {
    const bad = clone(F1);
    (bad.messaging as Record<string, unknown>) = {};
    const errors = checkBrandStrategyStructure(bad);
    expect(errors.some((e) => e.code === "BRAND_STRATEGY_MESSAGING")).toBe(true);
  });

  it("rejects a non-string entry in taglines", () => {
    const bad = clone(F1) as { taglines: unknown[] };
    bad.taglines = ["fine", 42];
    const errors = checkBrandStrategyStructure(bad);
    expect(errors.some((e) => e.code === "BRAND_STRATEGY_TAGLINES")).toBe(true);
  });

  it("rejects boilerplate missing long", () => {
    const bad = clone(F1);
    delete (bad.boilerplate as { long?: string }).long;
    const errors = checkBrandStrategyStructure(bad);
    expect(errors.some((e) => e.code === "BRAND_STRATEGY_BOILERPLATE")).toBe(true);
  });

  it("rejects a colorUsage pairing missing its rule", () => {
    const bad = clone(F1);
    delete (bad.colorUsage!.pairings[0] as { rule?: string }).rule;
    const errors = checkBrandStrategyStructure(bad);
    expect(errors.some((e) => e.code === "BRAND_STRATEGY_COLOR_USAGE")).toBe(true);
  });

  it("rejects accessibility with an empty contrast array", () => {
    const bad = clone(F1);
    bad.accessibility!.contrast = [];
    const errors = checkBrandStrategyStructure(bad);
    expect(errors.some((e) => e.code === "BRAND_STRATEGY_ACCESSIBILITY")).toBe(true);
  });

  it("rejects a pillar proof that is not a non-empty string array", () => {
    const bad = clone(F1);
    bad.pillars[0].proof = [];
    const errors = checkBrandStrategyStructure(bad);
    expect(errors.some((e) => e.code === "BRAND_STRATEGY_PROOF")).toBe(true);
  });

  it("serializes the Phase 2 fields for a public record", () => {
    const s = serializeBrandStrategy(F1) as BrandStrategy;
    expect(s.messaging?.roof).toBe(F1.messaging?.roof);
    expect(s.taglines).toEqual(F1.taglines);
    expect(s.boilerplate?.short).toBe(F1.boilerplate?.short);
    expect(s.colorUsage?.pairings.length).toBe(F1.colorUsage?.pairings.length);
    expect(s.accessibility?.standard).toBe("WCAG 2.1 AA");
    expect(s.pillars.find((p) => p.id === "coherence")?.proof?.length).toBeGreaterThan(0);
  });

  it("omits Phase 2 fields from serialization when absent", () => {
    const lean = clone(F1);
    delete lean.messaging;
    delete lean.taglines;
    delete lean.colorUsage;
    lean.pillars.forEach((p) => delete p.proof);
    const s = serializeBrandStrategy(lean) as BrandStrategy;
    expect(s.messaging).toBeUndefined();
    expect(s.taglines).toBeUndefined();
    expect(s.colorUsage).toBeUndefined();
    expect(s.pillars.every((p) => p.proof === undefined)).toBe(true);
  });

  it("drops the entire record (Phase 2 fields included) when private", () => {
    const priv = clone(F1);
    priv.visibility = "private";
    expect(serializeBrandStrategy(priv)).toBeNull();
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
        $defs: Record<string, Record<string, Record<string, unknown>>>;
      };
      expect(schema.properties["brand-strategy"]).toBeDefined();
      expect(schema.$defs.brandPillar).toBeDefined();
      expect(schema.$defs.brandGoverns).toBeDefined();
      expect(schema.$defs.brandVoiceTrait).toBeDefined();
      // Phase 2 wave-1 (VI-541): the new $defs + per-pillar proof.
      expect(schema.$defs.brandMessaging).toBeDefined();
      expect(schema.$defs.brandBoilerplate).toBeDefined();
      expect(schema.$defs.brandColorUsage).toBeDefined();
      expect(schema.$defs.brandColorPairing).toBeDefined();
      expect(schema.$defs.brandContrastTarget).toBeDefined();
      expect(schema.$defs.brandAccessibility).toBeDefined();
      expect(schema.$defs.brandPillar.properties.proof).toBeDefined();
    }
  });

  it("the two copies are byte-identical (VI-502 contract)", () => {
    expect(readFileSync(enginePath, "utf-8")).toBe(readFileSync(docsPath, "utf-8"));
  });
});
