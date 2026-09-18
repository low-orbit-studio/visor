/**
 * VI-638 — `typography.scale` reaches the font-size ramp
 *
 * `scale` promised "type scale multiplier applied to the font-size ramp" but
 * wrote a standalone `font-size: <scale>rem` on the host selector and left the
 * ramp at its absolute values. On a 0.85 theme scoped to `body.<theme>-theme`
 * the root stayed 16px, so `--font-size-base` read 16px while the body rendered
 * 13.6px — a 17.6% gap, wider than a full step of the ramp it belongs to.
 *
 * The ramp is now the single mechanism: `scale` multiplies every step, and the
 * page inherits the scaled base via `font-size: var(--font-size-base)` on
 * `body` (nextjs) or the docs scope class — never on `:root`, because the ramp
 * is expressed in `rem` and a scaled root would multiply it a second time.
 */

import { describe, it, expect } from "vitest";
import { generateThemeData } from "../pipeline.js";
import { generatePrimitivesCss, generateFontSizeDecls } from "../generate-css.js";
import { docsAdapter } from "../adapters/docs.js";
import { nextjsAdapter } from "../adapters/nextjs.js";
import type { AdapterInput } from "../adapters/types.js";

const RAMP = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"] as const;

function themeYaml(name: string, scale?: number): string {
  return `
name: ${name}
version: 1
colors:
  primary: "#2563EB"
${scale === undefined ? "" : `typography:\n  scale: ${scale}\n`}`;
}

function inputFromYaml(yaml: string): AdapterInput {
  const data = generateThemeData(yaml);
  return { primitives: data.primitives, tokens: data.tokens, config: data.config };
}

function primitivesCss(yaml: string, scopePrefix?: string): string {
  const data = generateThemeData(yaml);
  return generatePrimitivesCss(data.primitives, data.config, { scopePrefix });
}

/** Pull `--font-size-<step>` out of a CSS blob as a number of rem. */
function ramp(css: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const step of RAMP) {
    const m = css.match(new RegExp(`--font-size-${step.replace("2xl", "2xl")}: ([\\d.]+)rem;`));
    if (m) out[step] = Number(m[1]);
  }
  return out;
}

describe("VI-638 — the ramp responds to scale", () => {
  it("a scale: 0.5 theme and a scale: 1.0 theme generate DIFFERENT --font-size-* values", () => {
    // The assertion that failed before VI-638: the ramp was a literal map, so
    // these two were byte-identical.
    const half = ramp(primitivesCss(themeYaml("half", 0.5)));
    const full = ramp(primitivesCss(themeYaml("full", 1.0)));

    expect(Object.keys(half)).toHaveLength(RAMP.length);
    for (const step of RAMP) {
      expect(half[step]).not.toBe(full[step]);
      expect(half[step]).toBeCloseTo(full[step] * 0.5, 6);
    }
  });

  it("scales every step by the declared factor, not just the base", () => {
    const css = primitivesCss(themeYaml("scaled", 0.85));
    expect(css).toContain("--font-size-base: 0.85rem; /* 13.6px */");
    expect(css).toContain("--font-size-sm: 0.74375rem; /* 11.9px */");
    expect(css).toContain("--font-size-4xl: 1.9125rem; /* 30.6px */");
  });

  it("scale: 1.0 output is byte-identical to the unscaled default (no-op control)", () => {
    // Proves the fix is scoped to scaled themes: an unscaled theme's emission
    // must not move by so much as a rounding digit.
    expect(generateFontSizeDecls(1)).toEqual([
      "--font-size-xs: 0.75rem; /* 12px */",
      "--font-size-sm: 0.875rem; /* 14px */",
      "--font-size-base: 1rem; /* 16px */",
      "--font-size-lg: 1.125rem; /* 18px */",
      "--font-size-xl: 1.25rem; /* 20px */",
      "--font-size-2xl: 1.5rem; /* 24px */",
      "--font-size-3xl: 1.875rem; /* 30px */",
      "--font-size-4xl: 2.25rem; /* 36px */",
    ]);
    expect(ramp(primitivesCss(themeYaml("explicit-one", 1.0)))).toEqual(
      ramp(primitivesCss(themeYaml("omitted")))
    );
  });
});

describe("VI-638 — exactly one mechanism sets the base size", () => {
  it("the primitives block no longer writes a bare font-size declaration", () => {
    // The second mechanism. Its presence alongside a rem ramp is what made the
    // two disagree — and, under a `:root` host, what would multiply twice.
    for (const scope of [undefined, "body.scaled-theme"]) {
      const css = primitivesCss(themeYaml("scaled", 0.85), scope);
      expect(css).not.toMatch(/^\s*font-size:/m);
    }
  });

  it("nextjs binds the page to the scaled base token, on body and never :root", () => {
    const css = nextjsAdapter(inputFromYaml(themeYaml("scaled", 0.85)));
    expect(css).toContain("font-size: var(--font-size-base, 1rem);");
    expect(css).not.toContain("font-size: 0.85rem;");

    // The binding must land on body, not the root element — `rem` on a scaled
    // root would re-apply the scale to every step of the ramp.
    const binding = css.split("\n").findIndex((l) =>
      l.includes("font-size: var(--font-size-base, 1rem);")
    );
    const selector = css
      .split("\n")
      .slice(0, binding)
      .reverse()
      .find((l) => l.trim().endsWith("{"))!;
    expect(selector).toContain("body");
    expect(selector).not.toContain(":root");
  });

  it("docs binds the scope class to the scaled base token", () => {
    const css = docsAdapter(inputFromYaml(themeYaml("scaled", 0.85)));
    expect(css).toContain("font-size: var(--font-size-base, 1rem);");
    expect(css).toContain("--font-size-base: 0.85rem; /* 13.6px */");
  });

  it("docs no longer expresses scale as size-adjust on @font-face", () => {
    // The third mechanism (VI-354). It only ever applied to `visor-fonts`
    // slots, and against a scaled ramp it would shrink twice (0.85 x 0.85).
    const css = docsAdapter(
      inputFromYaml(`
name: scaled-visor-fonts
version: 1
colors:
  primary: "#2563EB"
typography:
  scale: 0.85
  heading:
    family: "PP Model Plastic"
    weight: 500
    weights: [300, 500, 700]
    source: visor-fonts
    org: low-orbit-studio
  body:
    family: "PP Model Sans"
    weight: 300
    weights: [300, 500, 700]
    source: visor-fonts
    org: low-orbit-studio
`)
    );
    expect(css).toContain("@font-face");
    expect(css).not.toContain("size-adjust");
  });
});

describe("VI-638 — the core generator and the docs adapter share one ramp", () => {
  it("emit identical --font-size-* values for the same theme", () => {
    for (const scale of [1, 0.85, 1.25]) {
      const yaml = themeYaml(`shared-${String(scale).replace(".", "-")}`, scale);
      expect(ramp(docsAdapter(inputFromYaml(yaml)))).toEqual(ramp(primitivesCss(yaml)));
    }
  });
});
