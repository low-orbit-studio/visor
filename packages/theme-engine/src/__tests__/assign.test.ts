import { assignSemanticTokens } from "../assign.js";
import { generateShadeScale } from "../shades.js";
import { resolveConfig } from "../resolve.js";
import type {
  GeneratedPrimitives,
  ResolvedThemeConfig,
  VisorThemeConfig,
  FullShadeScale,
  SelectiveShadeScale,
} from "../types.js";
import { TAILWIND_GRAY } from "../shades.js";

function buildTestPrimitives(config: ResolvedThemeConfig): GeneratedPrimitives {
  return {
    primary: generateShadeScale(config.colors.primary, "primary") as FullShadeScale,
    accent: generateShadeScale(config.colors.accent, "accent") as FullShadeScale,
    neutral:
      config.colors.neutral === null
        ? TAILWIND_GRAY
        : (generateShadeScale(config.colors.neutral, "neutral") as FullShadeScale),
    success: generateShadeScale(config.colors.success, "success") as SelectiveShadeScale,
    warning: generateShadeScale(config.colors.warning, "warning") as SelectiveShadeScale,
    error: generateShadeScale(config.colors.error, "error") as SelectiveShadeScale,
    info: generateShadeScale(config.colors.info, "info") as SelectiveShadeScale,
  };
}

describe("assignSemanticTokens", () => {
  const minimalInput: VisorThemeConfig = {
    name: "Test",
    version: 1,
    colors: { primary: "#2563EB" },
  };

  const config = resolveConfig(minimalInput);
  const primitives = buildTestPrimitives(config);
  // No colors-dark in minimalInput, so light and dark primitives are identical
  const tokens = assignSemanticTokens(primitives, primitives, config);

  it("returns all 4 categories", () => {
    expect(tokens).toHaveProperty("text");
    expect(tokens).toHaveProperty("surface");
    expect(tokens).toHaveProperty("border");
    expect(tokens).toHaveProperty("interactive");
  });

  it("text has 12 tokens", () => {
    expect(Object.keys(tokens.text)).toHaveLength(12);
  });

  it("surface has the expected number of tokens", () => {
    // 20 tokens: page, card, subtle, muted, overlay, interactive-*,
    // accent-*, success-*, warning-*, error-*, info-*
    expect(Object.keys(tokens.surface).length).toBeGreaterThanOrEqual(19);
  });

  it("border has 9 tokens", () => {
    expect(Object.keys(tokens.border)).toHaveLength(9);
  });

  it("interactive has 14 tokens", () => {
    const keys = Object.keys(tokens.interactive);
    expect(keys).toHaveLength(14);
    expect(keys).toContain("primary-bg");
    expect(keys).toContain("primary-bg-hover");
    expect(keys).toContain("primary-bg-active");
    expect(keys).toContain("primary-text");
    expect(keys).toContain("secondary-bg");
    expect(keys).toContain("secondary-bg-hover");
    expect(keys).toContain("secondary-bg-active");
    expect(keys).toContain("secondary-text");
    expect(keys).toContain("secondary-border");
    expect(keys).toContain("destructive-bg");
    expect(keys).toContain("destructive-bg-hover");
    expect(keys).toContain("destructive-text");
    expect(keys).toContain("ghost-bg");
    expect(keys).toContain("ghost-bg-hover");
  });

  it("each token has light and dark hex values", () => {
    const hexPattern = /^#[0-9a-fA-F]{6}$/;

    for (const category of ["text", "surface", "border", "interactive"] as const) {
      for (const [name, value] of Object.entries(tokens[category])) {
        expect(value.light, `${category}.${name}.light`).toMatch(hexPattern);
        expect(value.dark, `${category}.${name}.dark`).toMatch(hexPattern);
      }
    }
  });

  it("surface-page light equals config background", () => {
    expect(tokens.surface.page.light).toBe(config.colors.background);
  });

  it("surface-card light equals config surface", () => {
    expect(tokens.surface.card.light).toBe(config.colors.surface);
  });

  it("interactive-primary-text is #ffffff for both modes", () => {
    expect(tokens.interactive["primary-text"].light).toBe("#ffffff");
    expect(tokens.interactive["primary-text"].dark).toBe("#ffffff");
  });

  describe("surface.selected (VI-242)", () => {
    it("surface.selected resolves for both modes", () => {
      expect(tokens.surface.selected).toBeDefined();
      expect(tokens.surface.selected.light).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(tokens.surface.selected.dark).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it("surface.selected light is primary-100, dark is primary-800", () => {
      expect(tokens.surface.selected.light).toBe(primitives.primary[100]);
      expect(tokens.surface.selected.dark).toBe(primitives.primary[800]);
    });

    it("surface.selected is distinct from surface.accent-subtle in both modes", () => {
      expect(tokens.surface.selected.light).not.toBe(
        tokens.surface["accent-subtle"].light,
      );
      expect(tokens.surface.selected.dark).not.toBe(
        tokens.surface["accent-subtle"].dark,
      );
    });

    it("surface.selected is distinct from surface.interactive-active in both modes", () => {
      expect(tokens.surface.selected.light).not.toBe(
        tokens.surface["interactive-active"].light,
      );
      expect(tokens.surface.selected.dark).not.toBe(
        tokens.surface["interactive-active"].dark,
      );
    });
  });
});
