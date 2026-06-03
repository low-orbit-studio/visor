/**
 * VI-447 — 6-tier letter-spacing ramp
 *
 * Expands the typography letter-spacing scale from the legacy `tight | normal |
 * wide` triad to a 6-tier ramp (`xl | lg | md | sm | xs | tight`). The legacy
 * keys remain valid input and fold onto the ramp (`normal`→md, `wide`→lg,
 * `tight`→tight). Emission is additive — `--letter-spacing-normal` (= md) and
 * `--letter-spacing-wide` (= lg) are retained as back-compat aliases.
 */

import { describe, it, expect } from "vitest";
import { resolveConfig } from "../resolve.js";
import { validate } from "../validate.js";
import { generateThemeData } from "../pipeline.js";
import { docsAdapter } from "../adapters/docs.js";
import type { VisorThemeConfig } from "../types.js";
import type { AdapterInput } from "../adapters/types.js";

const RAMP_TIERS = ["xl", "lg", "md", "sm", "xs", "tight"] as const;

// Default ramp (resolve.ts DEFAULTS) — em-based, md anchored at the historical
// --letter-spacing-normal value so existing themes emit byte-identical output.
const DEFAULT_RAMP = {
  xl: "0.16em",
  lg: "0.1em",
  md: "0.05em",
  sm: "0.025em",
  xs: "0.01em",
  tight: "-0.01em",
} as const;

describe("VI-447 — resolveConfig letter-spacing ramp", () => {
  const minimal: VisorThemeConfig = {
    name: "Test",
    version: 1,
    colors: { primary: "#2563EB" },
  };

  it("resolves the full 6-tier ramp from the Visor defaults when omitted", () => {
    const resolved = resolveConfig(minimal);
    expect(resolved.typography["letter-spacing"]).toEqual(DEFAULT_RAMP);
  });

  it("md defaults to 0.05em (preserves legacy --letter-spacing-normal value)", () => {
    expect(resolveConfig(minimal).typography["letter-spacing"].md).toBe("0.05em");
  });

  it("folds legacy triad onto the ramp (normal→md, wide→lg, tight→tight)", () => {
    const resolved = resolveConfig({
      ...minimal,
      typography: {
        "letter-spacing": { tight: "-0.04em", normal: "0.02em", wide: "0.12em" },
      },
    });
    const ls = resolved.typography["letter-spacing"];
    expect(ls.md).toBe("0.02em"); // normal → md
    expect(ls.lg).toBe("0.12em"); // wide → lg
    expect(ls.tight).toBe("-0.04em"); // tight → tight
    // untouched tiers fall back to defaults
    expect(ls.xl).toBe(DEFAULT_RAMP.xl);
    expect(ls.sm).toBe(DEFAULT_RAMP.sm);
    expect(ls.xs).toBe(DEFAULT_RAMP.xs);
  });

  it("accepts explicit new-tier rem values (editorial ramp)", () => {
    const resolved = resolveConfig({
      ...minimal,
      typography: {
        "letter-spacing": {
          xl: "3.5rem",
          lg: "0.44rem",
          md: "0.225rem",
          sm: "0.1rem",
          xs: "0.07rem",
          tight: "0.03rem",
        },
      },
    });
    expect(resolved.typography["letter-spacing"]).toEqual({
      xl: "3.5rem",
      lg: "0.44rem",
      md: "0.225rem",
      sm: "0.1rem",
      xs: "0.07rem",
      tight: "0.03rem",
    });
  });

  it("explicit new keys win over legacy aliases (md over normal, lg over wide)", () => {
    const resolved = resolveConfig({
      ...minimal,
      typography: {
        "letter-spacing": {
          md: "0.06em",
          normal: "0.02em",
          lg: "0.11em",
          wide: "0.99em",
        },
      },
    });
    const ls = resolved.typography["letter-spacing"];
    expect(ls.md).toBe("0.06em");
    expect(ls.lg).toBe("0.11em");
  });
});

describe("VI-447 — validate letter-spacing ramp", () => {
  const base = { name: "Test", version: 1, colors: { primary: "#2563EB" } };

  it("accepts all six ramp tiers as valid CSS lengths", () => {
    const result = validate({
      ...base,
      typography: {
        "letter-spacing": {
          xl: "0.16em",
          lg: "0.1em",
          md: "0.05em",
          sm: "0.025em",
          xs: "0.01em",
          tight: "-0.01em",
        },
      },
    });
    expect(result.errors.some((e) => e.code === "INVALID_LETTER_SPACING")).toBe(false);
  });

  it("rejects an invalid CSS length on a new tier", () => {
    const result = validate({
      ...base,
      typography: { "letter-spacing": { xl: "not-a-length" } },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "INVALID_LETTER_SPACING")).toBe(true);
  });
});

describe("VI-447 — docsAdapter emits the ramp", () => {
  function inputFromYaml(yaml: string): AdapterInput {
    const data = generateThemeData(yaml);
    return { primitives: data.primitives, tokens: data.tokens, config: data.config };
  }

  const DEFAULT_YAML = `
name: ramp-default
version: 1
colors:
  primary: "#2563EB"
`;

  it("emits all six --letter-spacing-* tiers with default values", () => {
    const css = docsAdapter(inputFromYaml(DEFAULT_YAML));
    for (const tier of RAMP_TIERS) {
      expect(css).toContain(`--letter-spacing-${tier}: ${DEFAULT_RAMP[tier]};`);
    }
  });

  it("retains back-compat aliases (--letter-spacing-normal = md, --wide = lg)", () => {
    const css = docsAdapter(inputFromYaml(DEFAULT_YAML));
    expect(css).toContain(`--letter-spacing-normal: ${DEFAULT_RAMP.md};`);
    expect(css).toContain(`--letter-spacing-wide: ${DEFAULT_RAMP.lg};`);
  });

  it("flows editorial rem values through to emitted vars", () => {
    const css = docsAdapter(
      inputFromYaml(`
name: editorial
version: 1
colors:
  primary: "#2563EB"
typography:
  letter-spacing:
    xl: "3.5rem"
    lg: "0.44rem"
    md: "0.225rem"
    sm: "0.1rem"
    xs: "0.07rem"
    tight: "0.03rem"
`),
    );
    expect(css).toContain("--letter-spacing-xl: 3.5rem;");
    expect(css).toContain("--letter-spacing-tight: 0.03rem;");
    expect(css).toContain("--letter-spacing-normal: 0.225rem;"); // = md
    expect(css).toContain("--letter-spacing-wide: 0.44rem;"); // = lg
  });
});
