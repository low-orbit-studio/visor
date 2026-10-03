/**
 * VI-680 — the one switch for hairlines is settable from a theme.
 *
 * `hairlines: off` in a `.visor.yaml` is shorthand for
 * `components.hairline.width: "0"`, folded in at resolve time so every adapter
 * emits `--hairline-width: 0` through the VI-625 component-token path. Absent
 * (or `on`), nothing is emitted, so an existing theme's CSS is unchanged. The
 * switch is independent of VI-655's `edges`.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { generateThemeData, parseConfig } from "../pipeline.js";
import { validateConfig } from "../schema.js";
import { resolveConfig } from "../resolve.js";
import { nextjsAdapter } from "../adapters/nextjs.js";
import { docsAdapter } from "../adapters/docs.js";
import type { AdapterInput } from "../adapters/types.js";

const theme = (extra: string) => `
name: hairlines-probe
version: 1
colors:
  primary: "#6b46ff"
${extra}
`;

function emit(adapter: "nextjs" | "docs", yaml: string): string {
  const data = generateThemeData(yaml);
  const input = {
    config: resolveConfig(parseConfig(yaml)),
    primitives: data.primitives,
    tokens: data.tokens,
  } as AdapterInput;
  const out = adapter === "nextjs" ? nextjsAdapter(input) : docsAdapter(input);
  return typeof out === "string" ? out : Object.values(out).join("\n");
}

describe("VI-680 hairlines switch — theme field", () => {
  for (const adapter of ["nextjs", "docs"] as const) {
    it(`${adapter}: hairlines: off emits --hairline-width: 0 in both modes`, () => {
      const css = emit(adapter, theme("hairlines: off"));
      const matches = css.match(/--hairline-width: 0;/g) ?? [];
      // light + dark (manual toggle) + prefers-color-scheme
      expect(matches.length).toBeGreaterThanOrEqual(3);
    });

    it(`${adapter}: hairlines absent emits no width token — existing themes are unchanged`, () => {
      expect(emit(adapter, theme(""))).not.toContain("--hairline-width");
      // Mutation control: the same assertion fails once the switch is set.
      expect(emit(adapter, theme("hairlines: off"))).toContain("--hairline-width");
    });

    it(`${adapter}: hairlines: on emits exactly what an absent field emits`, () => {
      expect(emit(adapter, theme("hairlines: on"))).toBe(emit(adapter, theme("")));
    });

    it(`${adapter}: independent of edges — neither switch touches the other's tokens`, () => {
      const hairlinesOnly = emit(adapter, theme("hairlines: off"));
      expect(hairlinesOnly).not.toContain("--control-edge-width");
      const edgesOnly = emit(adapter, theme("edges: off"));
      expect(edgesOnly).not.toContain("--hairline-width");
      const both = emit(adapter, theme("edges: off\nhairlines: off"));
      expect(both).toContain("--control-edge-width: 0;");
      expect(both).toContain("--hairline-width: 0;");
    });
  }

  it("an explicit components.hairline.width wins over hairlines: off", () => {
    const resolved = resolveConfig(
      parseConfig(theme('hairlines: off\ncomponents:\n  hairline:\n    width: "2px"')),
    );
    expect(resolved.components?.hairline?.width).toBe("2px");
  });

  it("hairlines: off keeps the theme's other component bindings", () => {
    const resolved = resolveConfig(
      parseConfig(theme('hairlines: off\ncomponents:\n  chip:\n    radius: "4px"')),
    );
    expect(resolved.components?.chip?.radius).toBe("4px");
    expect(resolved.components?.hairline?.width).toBe("0");
    expect(resolved.components?.control).toBeUndefined();
  });

  it("validates the field and rejects any other value", () => {
    expect(validateConfig(parseConfig(theme("hairlines: off"))).valid).toBe(true);
    expect(validateConfig(parseConfig(theme("hairlines: on"))).valid).toBe(true);
    expect(() => parseConfig(theme("hairlines: none"))).toThrow("'hairlines' must be either 'on' or 'off'");
  });

  it("the JSON schema declares the field and the hairline family", () => {
    const schema = JSON.parse(readFileSync(join(__dirname, "..", "visor-theme.schema.json"), "utf-8"));
    expect(schema.properties.hairlines.enum).toEqual(["on", "off"]);
    expect(schema.properties.components.properties.hairline).toBeDefined();
    const docsSchema = JSON.parse(readFileSync(join(process.cwd(), "docs", "visor-theme.schema.json"), "utf-8"));
    expect(docsSchema).toEqual(schema);
  });
});
