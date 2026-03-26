import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { generateThemeData } from "../../pipeline.js";
import { nextjsAdapter } from "../nextjs.js";
import { fumadocsAdapter } from "../fumadocs.js";
import { deckAdapter } from "../deck.js";
import type { AdapterInput } from "../types.js";

const fixturesDir = resolve(__dirname, "../../__tests__/fixtures");

const MINIMAL_YAML = readFileSync(
  resolve(fixturesDir, "minimal.visor.yaml"),
  "utf-8",
);

const FULL_YAML = readFileSync(
  resolve(fixturesDir, "full.visor.yaml"),
  "utf-8",
);

function makeInput(yaml: string): AdapterInput {
  const data = generateThemeData(yaml);
  return { primitives: data.primitives, tokens: data.tokens, config: data.config };
}

describe("adapter integration", () => {
  describe("minimal fixture", () => {
    const input = makeInput(MINIMAL_YAML);

    it("nextjsAdapter produces non-empty output", () => {
      const css = nextjsAdapter(input);
      expect(css.length).toBeGreaterThan(100);
    });

    it("fumadocsAdapter produces non-empty output", () => {
      const css = fumadocsAdapter(input);
      expect(css.length).toBeGreaterThan(100);
    });

    it("deckAdapter produces non-empty output", () => {
      const css = deckAdapter(input);
      expect(css.length).toBeGreaterThan(100);
    });
  });

  describe("full fixture", () => {
    const input = makeInput(FULL_YAML);

    it("nextjsAdapter produces non-empty output", () => {
      const css = nextjsAdapter(input);
      expect(css.length).toBeGreaterThan(100);
    });

    it("fumadocsAdapter produces non-empty output", () => {
      const css = fumadocsAdapter(input);
      expect(css.length).toBeGreaterThan(100);
    });

    it("deckAdapter produces non-empty output", () => {
      const css = deckAdapter(input);
      expect(css.length).toBeGreaterThan(100);
    });
  });

  describe("generateThemeData", () => {
    it("returns config, primitives, tokens, and output", () => {
      const data = generateThemeData(MINIMAL_YAML);
      expect(data.config).toBeDefined();
      expect(data.config.name).toBe("Minimal");
      expect(data.primitives).toBeDefined();
      expect(data.primitives.primary).toBeDefined();
      expect(data.tokens).toBeDefined();
      expect(data.tokens.text).toBeDefined();
      expect(data.output).toBeDefined();
      expect(data.output.fullBundleCss).toBeDefined();
    });

    it("config has resolved defaults", () => {
      const data = generateThemeData(MINIMAL_YAML);
      // accent should be auto-derived since not specified
      expect(data.config.colors.accent).toBeDefined();
      // spacing base should be 4 (default)
      expect(data.config.spacing.base).toBe(4);
    });
  });
});
