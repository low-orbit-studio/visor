import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { generateThemeData } from "../../pipeline.js";
import { deckAdapter } from "../deck.js";
import type { AdapterInput } from "../types.js";

const MINIMAL_YAML = readFileSync(
  resolve(__dirname, "../../__tests__/fixtures/minimal.visor.yaml"),
  "utf-8",
);

function makeInput(yaml: string): AdapterInput {
  const data = generateThemeData(yaml);
  return { primitives: data.primitives, tokens: data.tokens, config: data.config };
}

describe("deckAdapter", () => {
  it("scopes all tokens under .deck--{name} class", () => {
    const css = deckAdapter(makeInput(MINIMAL_YAML));
    expect(css).toContain(".deck--minimal {");
  });

  it("includes dark mode scoping", () => {
    const css = deckAdapter(makeInput(MINIMAL_YAML));
    expect(css).toContain(".dark .deck--minimal {");
  });

  it("does not use :root selectors", () => {
    const css = deckAdapter(makeInput(MINIMAL_YAML));
    expect(css).not.toMatch(/\n:root\s*\{/);
  });

  it("respects custom scopeClass option", () => {
    const css = deckAdapter(makeInput(MINIMAL_YAML), { scopeClass: ".my-deck" });
    expect(css).toContain(".my-deck {");
    expect(css).toContain(".dark .my-deck {");
  });

  it("includes primitive tokens", () => {
    const css = deckAdapter(makeInput(MINIMAL_YAML));
    expect(css).toContain("--color-primary-");
    expect(css).toContain("--spacing-");
    expect(css).toContain("--radius-");
  });

  it("includes semantic tokens", () => {
    const css = deckAdapter(makeInput(MINIMAL_YAML));
    expect(css).toContain("--text-primary:");
    expect(css).toContain("--surface-page:");
    expect(css).toContain("--border-default:");
    expect(css).toContain("--interactive-primary-bg:");
  });

  it("wraps in @layer visor-adaptive", () => {
    const css = deckAdapter(makeInput(MINIMAL_YAML));
    expect(css).toContain("@layer visor-adaptive {");
  });

  it("includes prefers-color-scheme media query", () => {
    const css = deckAdapter(makeInput(MINIMAL_YAML));
    expect(css).toContain("prefers-color-scheme: dark");
  });
});
