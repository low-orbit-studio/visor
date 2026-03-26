import {
  generateTheme,
  generateThemeFromConfig,
  parseConfig,
} from "../pipeline.js";
import type { VisorThemeConfig } from "../types.js";

const MINIMAL_YAML = `
name: Test Theme
version: 1
colors:
  primary: "#2563EB"
`.trim();

describe("parseConfig", () => {
  it("parses valid YAML into a VisorThemeConfig", () => {
    const config = parseConfig(MINIMAL_YAML);
    expect(config.name).toBe("Test Theme");
    expect(config.version).toBe(1);
    expect(config.colors.primary).toBe("#2563EB");
  });

  it("throws a descriptive error for invalid YAML", () => {
    const badYaml = `
name: Bad
version: 1
colors: "not an object"
    `.trim();
    expect(() => parseConfig(badYaml)).toThrow(/Invalid/);
  });
});

describe("generateTheme", () => {
  it("produces ThemeOutput with all 5 CSS strings", () => {
    const output = generateTheme(MINIMAL_YAML);
    expect(output).toHaveProperty("primitivesCss");
    expect(output).toHaveProperty("semanticCss");
    expect(output).toHaveProperty("lightCss");
    expect(output).toHaveProperty("darkCss");
    expect(output).toHaveProperty("fullBundleCss");
    expect(typeof output.primitivesCss).toBe("string");
    expect(typeof output.semanticCss).toBe("string");
    expect(typeof output.lightCss).toBe("string");
    expect(typeof output.darkCss).toBe("string");
    expect(typeof output.fullBundleCss).toBe("string");
  });
});

describe("generateThemeFromConfig", () => {
  it("produces same output from a config object", () => {
    const config: VisorThemeConfig = {
      name: "Test Theme",
      version: 1,
      colors: { primary: "#2563EB" },
    };
    const output = generateThemeFromConfig(config);
    expect(output).toHaveProperty("primitivesCss");
    expect(output).toHaveProperty("semanticCss");
    expect(output).toHaveProperty("lightCss");
    expect(output).toHaveProperty("darkCss");
    expect(output).toHaveProperty("fullBundleCss");
  });
});

describe("ThemeOutput content", () => {
  const output = generateTheme(MINIMAL_YAML);

  it("fullBundleCss contains :root blocks", () => {
    expect(output.fullBundleCss).toContain(":root");
  });

  it("darkCss contains .dark selectors", () => {
    expect(output.darkCss).toContain(".dark");
  });

  it("darkCss contains prefers-color-scheme media query", () => {
    expect(output.darkCss).toContain("@media (prefers-color-scheme: dark)");
  });

  it("primitivesCss contains --color-primary-600", () => {
    expect(output.primitivesCss).toContain("--color-primary-600");
  });

  it("lightCss contains --text-primary", () => {
    expect(output.lightCss).toContain("--text-primary");
  });
});
