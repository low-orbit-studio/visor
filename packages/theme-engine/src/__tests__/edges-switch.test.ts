/**
 * VI-655 — the one switch for form-control edges is settable from a theme.
 *
 * `edges: off` in a `.visor.yaml` is shorthand for
 * `components.control.edge-width: "0"`, folded in at resolve time so every
 * adapter emits it through the VI-625 component-token path. Absent (or `on`),
 * nothing is emitted, so an existing theme's generated CSS is unchanged.
 */

import { describe, expect, it } from "vitest";
import { generateThemeData, parseConfig } from "../pipeline.js";
import { validateConfig } from "../schema.js";
import { resolveConfig } from "../resolve.js";
import { nextjsAdapter } from "../adapters/nextjs.js";
import { docsAdapter } from "../adapters/docs.js";
import type { AdapterInput } from "../adapters/types.js";

const theme = (extra: string) => `
name: edges-probe
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

describe("VI-655 edges switch — theme field", () => {
  for (const adapter of ["nextjs", "docs"] as const) {
    it(`${adapter}: edges: off emits --control-edge-width: 0 in both modes`, () => {
      const css = emit(adapter, theme("edges: off"));
      const matches = css.match(/--control-edge-width: 0;/g) ?? [];
      // light + dark (manual toggle) + prefers-color-scheme
      expect(matches.length).toBeGreaterThanOrEqual(3);
    });

    it(`${adapter}: edges absent emits no edge token — existing themes are unchanged`, () => {
      const css = emit(adapter, theme(""));
      expect(css).not.toContain("--control-edge-width");
      // Mutation control: the same assertion fails once the switch is set.
      expect(emit(adapter, theme("edges: off"))).toContain("--control-edge-width");
    });

    it(`${adapter}: edges: on emits exactly what an absent field emits`, () => {
      expect(emit(adapter, theme("edges: on"))).toBe(emit(adapter, theme("")));
    });
  }

  it("an explicit components.control.edge-width wins over edges: off", () => {
    const resolved = resolveConfig(
      parseConfig(theme('edges: off\ncomponents:\n  control:\n    edge-width: "2px"')),
    );
    expect(resolved.components?.control?.["edge-width"]).toBe("2px");
  });

  it("edges: off keeps the theme's other component bindings", () => {
    const resolved = resolveConfig(
      parseConfig(theme('edges: off\ncomponents:\n  chip:\n    radius: "4px"')),
    );
    expect(resolved.components?.chip?.radius).toBe("4px");
    expect(resolved.components?.control?.["edge-width"]).toBe("0");
  });

  it("validates the field", () => {
    expect(validateConfig(parseConfig(theme("edges: off"))).valid).toBe(true);
    expect(validateConfig(parseConfig(theme("edges: on"))).valid).toBe(true);
    expect(() => parseConfig(theme("edges: none"))).toThrow("'edges' must be either 'on' or 'off'");
  });
});
