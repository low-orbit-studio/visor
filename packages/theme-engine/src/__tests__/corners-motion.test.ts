/**
 * VI-796 — corner shape and the kit's motion values are settable from a theme.
 *
 * `corners: squircle` emits `--corner-shape: squircle` and binds `corner-shape`
 * to every element in the lowest layer; `border-radius` is never touched, so a
 * browser without `corner-shape` drops the declaration and draws round.
 * `motion.easing-out` sets `--motion-easing-ease-out`, and the five role
 * durations emit `--motion-duration-<role>` only when set. A theme that sets
 * none of them emits exactly what it did before.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { transform } from "lightningcss";
import { describe, expect, it } from "vitest";
import { generateThemeData, parseConfig } from "../pipeline.js";
import { validateConfig } from "../schema.js";
import { exportTheme } from "../export.js";
import { nextjsAdapter } from "../adapters/nextjs.js";
import { docsAdapter } from "../adapters/docs.js";

const theme = (extra: string) => `
name: corners-probe
version: 1
colors:
  primary: "#6b46ff"
${extra}
`;

// The honcho kit's values (honcho-planning components/honcho-kit/motion.ts).
const KIT_MOTION = `motion:
  easing: "cubic-bezier(0.83, 0, 0.17, 1)"
  easing-out: "cubic-bezier(0.22, 1, 0.36, 1)"
  duration-enter: 800ms
  duration-exit: 380ms
  duration-page: 1200ms
  duration-stagger: 75ms
  duration-enter-delay: 120ms`;

function emit(adapter: "nextjs" | "docs" | "default", yaml: string): string {
  const data = generateThemeData(yaml);
  if (adapter === "default") return data.output.primitivesCss;
  return adapter === "nextjs" ? nextjsAdapter(data) : docsAdapter(data);
}

function baseLayer(css: string): string {
  const start = css.indexOf("@layer visor-base {");
  if (start === -1) return "";
  return css.slice(start, css.indexOf("\n@layer ", start));
}

describe("VI-796 corners switch", () => {
  for (const adapter of ["nextjs", "docs"] as const) {
    it(`${adapter}: corners: squircle emits the token and the base-layer binding`, () => {
      const css = emit(adapter, theme("corners: squircle"));
      expect(css).toContain("--corner-shape: squircle;");
      expect(baseLayer(css)).toContain("*, *::before, *::after {\n  corner-shape: var(--corner-shape);\n}");
    });

    it(`${adapter}: corners absent or round emits nothing corner-related`, () => {
      const absent = emit(adapter, theme(""));
      expect(absent).not.toContain("corner-shape");
      expect(emit(adapter, theme("corners: round"))).toBe(absent);
      // Mutation control: the same assertion fails once the switch is set.
      expect(emit(adapter, theme("corners: squircle"))).toContain("corner-shape");
    });

    it(`${adapter}: squircle leaves every border-radius value as it is (round fallback)`, () => {
      const radii = (css: string) => css.match(/--radius-[\w-]+: [^;]+;/g);
      expect(radii(emit(adapter, theme("corners: squircle")))).toEqual(radii(emit(adapter, theme(""))));
    });
  }

  it("default pipeline output carries the token", () => {
    expect(emit("default", theme("corners: squircle"))).toContain("--corner-shape: squircle;");
    expect(emit("default", theme(""))).not.toContain("corner-shape");
  });

  it("nextjs: no binding when the consumer declines the base layer", () => {
    const css = nextjsAdapter(generateThemeData(theme("corners: squircle")), { includeBaseLayer: false });
    expect(css).not.toContain("corner-shape: var(--corner-shape)");
    expect(css).toContain("--corner-shape: squircle;");
  });

  it("validates the field and rejects any other value", () => {
    expect(validateConfig(parseConfig(theme("corners: squircle"))).valid).toBe(true);
    expect(validateConfig(parseConfig(theme("corners: round"))).valid).toBe(true);
    expect(() => parseConfig(theme("corners: bevel"))).toThrow("'corners' must be either 'round' or 'squircle'");
  });

  it("survives a Lightning CSS build (Next.js 16 targets)", () => {
    const code = transform({
      filename: "theme.css",
      code: Buffer.from(emit("nextjs", theme("corners: squircle")).replace(/@import[^;]+;/g, "")),
      minify: true,
      targets: { chrome: 111 << 16, edge: 111 << 16, firefox: 111 << 16, safari: (16 << 16) | (4 << 8) },
    }).code.toString();
    expect(code).toContain("corner-shape:var(--corner-shape)");
    expect(code).toContain("--corner-shape:squircle");
  });
});

describe("VI-796 motion values", () => {
  it("carries the kit's curves and durations", () => {
    for (const adapter of ["nextjs", "docs"] as const) {
      const css = emit(adapter, theme(KIT_MOTION));
      expect(css).toContain("--motion-easing-ease-in-out: cubic-bezier(0.83, 0, 0.17, 1);");
      expect(css).toContain("--motion-easing-ease-out: cubic-bezier(0.22, 1, 0.36, 1);");
      expect(css).toContain("--motion-duration-enter: 800ms;");
      expect(css).toContain("--motion-duration-exit: 380ms;");
      expect(css).toContain("--motion-duration-page: 1200ms;");
      expect(css).toContain("--motion-duration-stagger: 75ms;");
      expect(css).toContain("--motion-duration-enter-delay: 120ms;");
    }
  });

  it("each role duration emits only when set", () => {
    const css = emit("nextjs", theme("motion:\n  duration-exit: 380ms"));
    expect(css).toContain("--motion-duration-exit: 380ms;");
    for (const role of ["enter", "page", "stagger", "enter-delay"]) {
      expect(css).not.toContain(`--motion-duration-${role}:`);
    }
  });

  it("easing-out changes only --motion-easing-ease-out", () => {
    const base = emit("nextjs", theme(""));
    expect(base).toContain("--motion-easing-ease-out: cubic-bezier(0, 0, 0.2, 1);");
    const set = emit("nextjs", theme('motion:\n  easing-out: "cubic-bezier(0.22, 1, 0.36, 1)"'));
    expect(set.replace("cubic-bezier(0.22, 1, 0.36, 1)", "cubic-bezier(0, 0, 0.2, 1)")).toBe(base);
  });

  it("fast / normal / slow stay as they are", () => {
    const css = emit("nextjs", theme(KIT_MOTION));
    expect(css).toContain("--motion-duration-100: 100ms;");
    expect(css).toContain("--motion-duration-200: 200ms;");
    expect(css).toContain("--motion-duration-500: 500ms;");
  });

  it("validates the new keys and the Nms pattern", () => {
    expect(validateConfig(parseConfig(theme(KIT_MOTION))).valid).toBe(true);
    expect(() => parseConfig(theme("motion:\n  duration-exit: 0.38s"))).toThrow(
      `'motion.duration-exit' must match pattern "Nms"`,
    );
    expect(() => parseConfig(theme("motion:\n  duration-bounce: 10ms"))).toThrow("Unknown key 'motion.duration-bounce'");
  });

  it("exportTheme round-trips the new keys and corners", () => {
    const data = generateThemeData(theme(`corners: squircle\n${KIT_MOTION}`));
    const yaml = exportTheme(data.primitives, data.config);
    const again = parseConfig(yaml);
    expect(again.corners).toBe("squircle");
    expect(again.motion).toMatchObject({
      "easing-out": "cubic-bezier(0.22, 1, 0.36, 1)",
      "duration-enter": "800ms",
      "duration-exit": "380ms",
      "duration-page": "1200ms",
      "duration-stagger": "75ms",
      "duration-enter-delay": "120ms",
    });
  });

  it("the JSON schema declares the new fields and both copies match", () => {
    const schema = JSON.parse(readFileSync(join(__dirname, "..", "visor-theme.schema.json"), "utf-8"));
    expect(schema.properties.corners.enum).toEqual(["round", "squircle"]);
    for (const key of ["easing-out", "duration-enter", "duration-exit", "duration-page", "duration-stagger", "duration-enter-delay"]) {
      expect(schema.properties.motion.properties[key]).toBeDefined();
    }
    const docsSchema = JSON.parse(readFileSync(join(process.cwd(), "docs", "visor-theme.schema.json"), "utf-8"));
    expect(docsSchema).toEqual(schema);
  });
});
