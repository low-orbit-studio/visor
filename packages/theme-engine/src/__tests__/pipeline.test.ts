import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  generateTheme,
  generateThemeFromConfig,
  parseConfig,
} from "../pipeline.js";
import type { VisorThemeConfig } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

describe("borderless theme integration", () => {
  const fixtureYaml = readFileSync(
    resolve(__dirname, "fixtures/borderless-theme.visor.yaml"),
    "utf-8"
  );
  const output = generateTheme(fixtureYaml);

  it("parses the borderless fixture without error", () => {
    expect(output).toHaveProperty("lightCss");
    expect(output).toHaveProperty("darkCss");
  });

  it("lightCss emits --border-default: transparent", () => {
    expect(output.lightCss).toContain("--border-default: transparent");
  });

  it("lightCss emits --border-muted: transparent", () => {
    expect(output.lightCss).toContain("--border-muted: transparent");
  });

  it("lightCss emits --border-strong: transparent", () => {
    expect(output.lightCss).toContain("--border-strong: transparent");
  });

  it("darkCss emits --border-default: transparent", () => {
    expect(output.darkCss).toContain("--border-default: transparent");
  });

  it("darkCss emits --border-muted: transparent", () => {
    expect(output.darkCss).toContain("--border-muted: transparent");
  });

  it("darkCss emits --border-strong: transparent", () => {
    expect(output.darkCss).toContain("--border-strong: transparent");
  });

  it("lightCss still emits --border-focus (not overridden)", () => {
    expect(output.lightCss).toContain("--border-focus");
  });

  it("lightCss still emits --border-error (not overridden)", () => {
    expect(output.lightCss).toContain("--border-error");
  });

  it("lightCss still emits --border-disabled (not overridden)", () => {
    expect(output.lightCss).toContain("--border-disabled");
  });

  it("shadows are suppressed to none in both modes", () => {
    expect(output.fullBundleCss).toContain("--shadow-xs: none");
    expect(output.fullBundleCss).toContain("--shadow-sm: none");
  });
});
