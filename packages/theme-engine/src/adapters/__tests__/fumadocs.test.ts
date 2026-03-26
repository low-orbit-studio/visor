import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { generateThemeData } from "../../pipeline.js";
import { fumadocsAdapter } from "../fumadocs.js";
import { FUMADOCS_BRIDGE_MAP } from "../fumadocs-map.js";
import type { AdapterInput } from "../types.js";

const MINIMAL_YAML = readFileSync(
  resolve(__dirname, "../../__tests__/fixtures/minimal.visor.yaml"),
  "utf-8",
);

function makeInput(yaml: string): AdapterInput {
  const data = generateThemeData(yaml);
  return { primitives: data.primitives, tokens: data.tokens, config: data.config };
}

describe("fumadocsAdapter", () => {
  it("generates all --color-fd-* tokens", () => {
    const css = fumadocsAdapter(makeInput(MINIMAL_YAML));
    for (const fdToken of Object.keys(FUMADOCS_BRIDGE_MAP)) {
      expect(css).toContain(`--color-${fdToken}:`);
    }
  });

  it("includes .dark block", () => {
    const css = fumadocsAdapter(makeInput(MINIMAL_YAML));
    expect(css).toContain(".dark {");
  });

  it("includes html:not(.dark) block", () => {
    const css = fumadocsAdapter(makeInput(MINIMAL_YAML));
    expect(css).toContain("html:not(.dark) {");
  });

  it("wraps output in @layer visor-bridge", () => {
    const css = fumadocsAdapter(makeInput(MINIMAL_YAML));
    expect(css).toContain("@layer visor-bridge {");
  });

  it("produces valid CSS with hex values", () => {
    const css = fumadocsAdapter(makeInput(MINIMAL_YAML));
    // fd-background should have a hex value from surface-page
    const match = css.match(/--color-fd-background:\s*(#[0-9a-fA-F]{6})/);
    expect(match).not.toBeNull();
  });

  it("is deterministic", () => {
    const input = makeInput(MINIMAL_YAML);
    const css1 = fumadocsAdapter(input);
    const css2 = fumadocsAdapter(input);
    expect(css1).toBe(css2);
  });
});
