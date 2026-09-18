/**
 * VI-639 — the named font-weight ramp resolves against the weights a theme loads
 *
 * `--font-weight-semibold` was emitted as `typography.heading.weight`, which is
 * a different concept. On a theme whose heading weight is 500 it collapsed onto
 * `medium`; where it is 400 it collapsed onto `normal`; where it is above
 * `bold` it inverted the ramp. `medium` and `bold` were bare literals that
 * ignored the `weights` array entirely.
 *
 * The ramp now resolves through the CSS font-matching algorithm against the
 * faces a theme declares, the role tokens (`--weight-heading`, `--weight-body`,
 * `--weight-display`) carry theme intent, and a discrete ladder makes every
 * declared weight reachable by name.
 */

import { describe, it, expect } from "vitest";
import { generateThemeData } from "../pipeline.js";
import { generatePrimitivesCss } from "../generate-css.js";
import { docsAdapter } from "../adapters/docs.js";
import { validate } from "../validate.js";
import {
  matchLoadedWeight,
  resolveWeightRamp,
  loadedWeights,
  declaresWeights,
} from "../font-weights.js";
import type { AdapterInput } from "../adapters/types.js";

const NAMES = ["normal", "medium", "semibold", "bold"] as const;

/**
 * The Blacklight family: four PP Model slots loading the full five-weight ramp,
 * with a heading weight of 500 — the theme the bug was found on.
 */
const BLACKLIGHT_YAML = `
name: Blacklight Like
version: 1
colors:
  primary: "#2563EB"
typography:
  heading:
    family: "PP Model Plastic"
    weight: 500
    weights: [300, 400, 500, 700, 800]
    source: visor-fonts
    org: low-orbit-studio
  display:
    family: "PP Model Plastic"
    weight: 500
    weights: [300, 400, 500, 700, 800]
    source: visor-fonts
    org: low-orbit-studio
  body:
    family: "PP Model Sans"
    weight: 300
    weights: [300, 400, 500, 700, 800]
    source: visor-fonts
    org: low-orbit-studio
`;

/** Two loaded faces — four names cannot be four distinct weights here. */
const TWO_FACE_YAML = `
name: Two Face
version: 1
colors:
  primary: "#2563EB"
typography:
  heading:
    family: Satoshi
    weight: 700
    weights: [400, 700]
    source: fontshare
  body:
    family: Satoshi
    weight: 400
    weights: [400, 700]
    source: fontshare
`;

/** No `weights` array anywhere — historical emission must not move. */
const UNDECLARED_YAML = `
name: Undeclared
version: 1
colors:
  primary: "#2563EB"
typography:
  heading:
    family: "system-ui"
    weight: 700
  body:
    family: "system-ui"
    weight: 400
`;

function inputFromYaml(yaml: string): AdapterInput {
  const data = generateThemeData(yaml);
  return { primitives: data.primitives, tokens: data.tokens, config: data.config };
}

function cssFor(yaml: string): string {
  const data = generateThemeData(yaml);
  return generatePrimitivesCss(data.primitives, data.config);
}

/** Read the four named weight tokens out of a CSS blob. */
function ramp(css: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const name of NAMES) {
    const m = css.match(new RegExp(`--font-weight-${name}: (\\d+);`));
    if (m) out[name] = Number(m[1]);
  }
  return out;
}

describe("VI-639 — semibold is a ramp step, not the heading weight", () => {
  it("does not collapse onto medium on a theme whose heading weight is 500", () => {
    // The assertion that fails before VI-639: both read 500.
    const r = ramp(cssFor(BLACKLIGHT_YAML));
    expect(r.semibold).not.toBe(r.medium);
    expect(r).toEqual({ normal: 300, medium: 500, semibold: 700, bold: 700 });
  });

  it("does not track the heading weight when the heading weight changes", () => {
    const heavier = BLACKLIGHT_YAML.replace("weight: 500\n    weights", "weight: 800\n    weights");
    expect(ramp(cssFor(heavier)).semibold).toBe(ramp(cssFor(BLACKLIGHT_YAML)).semibold);
  });

  it("never inverts: normal <= medium <= semibold <= bold on every shape", () => {
    for (const yaml of [BLACKLIGHT_YAML, TWO_FACE_YAML, UNDECLARED_YAML]) {
      const r = ramp(cssFor(yaml));
      expect(r.normal).toBeLessThanOrEqual(r.medium);
      expect(r.medium).toBeLessThanOrEqual(r.semibold);
      expect(r.semibold).toBeLessThanOrEqual(r.bold);
    }
  });

  it("emits only weights the theme declared", () => {
    for (const yaml of [BLACKLIGHT_YAML, TWO_FACE_YAML]) {
      const data = generateThemeData(yaml);
      const loaded = loadedWeights(data.config.typography);
      for (const value of Object.values(ramp(cssFor(yaml)))) {
        expect(loaded).toContain(value);
      }
    }
  });
});

describe("VI-639 — resolution follows CSS font matching", () => {
  it("prefers a heavier face up to 500 for a 400–500 target (CSS Fonts 4 §5.2)", () => {
    expect(matchLoadedWeight(400, [300, 500, 700])).toBe(500);
    expect(matchLoadedWeight(450, [400, 700, 900])).toBe(400);
    expect(matchLoadedWeight(500, [300, 400, 700])).toBe(400);
  });

  it("goes heavier first above 500, lighter first below 400", () => {
    expect(matchLoadedWeight(600, [500, 700])).toBe(700);
    expect(matchLoadedWeight(700, [300, 400, 500, 800])).toBe(800);
    expect(matchLoadedWeight(300, [200, 600])).toBe(200);
    expect(matchLoadedWeight(300, [600, 900])).toBe(600);
  });

  it("returns the exact weight when loaded, and the target when nothing is", () => {
    expect(matchLoadedWeight(600, [400, 600, 700])).toBe(600);
    expect(matchLoadedWeight(600, [])).toBe(600);
  });

  it("resolves a theme declaring [200, 400, 600, 900] to faces it fetched", () => {
    // The ticket's hypothetical. Every name lands on a declared face.
    const declared = [200, 400, 600, 900];
    const resolved = resolveWeightRamp({
      heading: { weight: 900, weights: declared },
      body: { weight: 400, weights: declared },
    });
    expect(resolved).toEqual({ normal: 400, medium: 400, semibold: 600, bold: 900 });
    for (const value of Object.values(resolved)) expect(declared).toContain(value);
  });
});

describe("VI-639 — role tokens carry theme intent", () => {
  it("emits --weight-heading, --weight-body and --weight-display per theme", () => {
    const css = cssFor(BLACKLIGHT_YAML);
    expect(css).toContain("--font-weight-heading: 500;");
    expect(css).toContain("--font-weight-body: 300;");
    expect(css).toContain("--font-weight-display: 500;");
    // Back-compat: --weight-display predates VI-639 and has no competing
    // definition in the tokens package, so it is still emitted.
    expect(css).toContain("--weight-display: 500;");
  });

  it("--font-weight-heading keeps following heading.weight, independent of the ramp", () => {
    // This is what stops un-pinning semibold from flattening every heading:
    // packages/tokens aliases --weight-heading to --font-weight-semibold, and
    // the engine never emitted a per-theme value before now.
    const css = cssFor(BLACKLIGHT_YAML);
    expect(css).toContain("--font-weight-heading: 500;");
    expect(css).toContain("--font-weight-semibold: 700;");
  });

  it("coerces a role weight the theme never loaded onto a face it did", () => {
    // strata declares body.weight 450 against [400, 700, 900].
    const css = cssFor(`
name: Strata Like
version: 1
colors:
  primary: "#2563EB"
typography:
  heading:
    family: "Satoshi"
    weight: 800
    weights: [400, 700, 900]
    source: fontshare
  body:
    family: "Satoshi"
    weight: 450
    weights: [400, 700, 900]
    source: fontshare
`);
    expect(css).toContain("--font-weight-body: 400;");
    expect(css).toContain("--font-weight-heading: 900;");
    expect(css).not.toContain("450;");
  });
});

describe("VI-639 — the declared ladder is reachable by name", () => {
  it("emits --font-weight-<n> for every declared weight, including the 800", () => {
    const css = cssFor(BLACKLIGHT_YAML);
    for (const w of [300, 400, 500, 700, 800]) {
      expect(css).toContain(`--font-weight-${w}: ${w};`);
    }
  });

  it("emits no ladder for a theme that declares no weights array", () => {
    const css = cssFor(UNDECLARED_YAML);
    expect(css).not.toMatch(/--font-weight-\d{3}:/);
  });
});

describe("VI-639 — themes that declare no weights are untouched", () => {
  it("keeps the historical ramp, minus the heading pin", () => {
    // Only `semibold` moves, from heading.weight to the canonical 600. The
    // other three are byte-identical to the pre-VI-639 emission.
    expect(ramp(cssFor(UNDECLARED_YAML))).toEqual({
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    });
    expect(declaresWeights(generateThemeData(UNDECLARED_YAML).config.typography)).toBe(false);
  });
});

describe("VI-639 — the core generator and the docs adapter agree", () => {
  it("emit the same named ramp, role tokens and ladder", () => {
    for (const yaml of [BLACKLIGHT_YAML, TWO_FACE_YAML, UNDECLARED_YAML]) {
      const docs = docsAdapter(inputFromYaml(yaml));
      expect(ramp(docs)).toEqual(ramp(cssFor(yaml)));
      for (const role of ["heading", "body", "display"]) {
        const m = cssFor(yaml).match(new RegExp(`--font-weight-${role}: (\\d+);`))!;
        expect(docs).toContain(m[0]);
      }
    }
  });
});

describe("VI-639 — build-time warnings (D4)", () => {
  const base = { name: "Warn", version: 1 as const, colors: { primary: "#2563EB" } };

  it("warns when a hosted font source declares no weights array", () => {
    const result = validate({
      ...base,
      typography: {
        heading: { family: "Satoshi", weight: 700, source: "fontshare" },
        body: { family: "Satoshi", weight: 400, source: "fontshare" },
      },
    });
    expect(result.warnings.some((w) => w.code === "FONT_WEIGHTS_UNDECLARED")).toBe(true);
  });

  it("warns when a two-face family collapses adjacent ramp steps", () => {
    const result = validate({
      ...base,
      typography: {
        heading: { family: "Satoshi", weight: 700, weights: [400, 700], source: "fontshare" },
        body: { family: "Satoshi", weight: 400, weights: [400, 700], source: "fontshare" },
      },
    });
    expect(result.warnings.some((w) => w.code === "FONT_WEIGHT_RAMP_COLLAPSED")).toBe(true);
  });

  it("stays quiet on a theme that loads a face for every named step", () => {
    const result = validate({
      ...base,
      typography: {
        heading: { family: "Satoshi", weight: 700, weights: [400, 500, 600, 700], source: "fontshare" },
        body: { family: "Satoshi", weight: 400, weights: [400, 500, 600, 700], source: "fontshare" },
      },
    });
    expect(result.warnings.some((w) => w.code.startsWith("FONT_WEIGHT"))).toBe(false);
  });

  it("neither warning is an error — substitution is legal CSS", () => {
    const result = validate({
      ...base,
      typography: {
        heading: { family: "Satoshi", weight: 700, weights: [400, 700], source: "fontshare" },
        body: { family: "Satoshi", weight: 400, weights: [400, 700], source: "fontshare" },
      },
    });
    expect(result.errors.some((e) => e.code.startsWith("FONT_WEIGHT"))).toBe(false);
  });
});
