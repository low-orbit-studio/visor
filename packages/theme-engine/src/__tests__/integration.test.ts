import {
  generateTheme,
  generatePrimitives,
  parseConfig,
  generateThemeFromConfig,
} from "../pipeline.js";
import { exportTheme } from "../export.js";
import { resolveConfig } from "../resolve.js";
import type { VisorThemeConfig } from "../types.js";

const MINIMAL_YAML = `
name: Test Theme
version: 1
colors:
  primary: "#2563EB"
`.trim();

describe("integration: minimum viable theme", () => {
  const output = generateTheme(MINIMAL_YAML);

  it("light CSS contains all expected adaptive tokens", () => {
    expect(output.lightCss).toContain("--text-primary");
    expect(output.lightCss).toContain("--surface-page");
    expect(output.lightCss).toContain("--border-default");
    expect(output.lightCss).toContain("--interactive-primary-bg");
  });

  it("dark CSS contains all expected adaptive tokens", () => {
    expect(output.darkCss).toContain("--text-primary");
    expect(output.darkCss).toContain("--surface-page");
    expect(output.darkCss).toContain("--border-default");
    expect(output.darkCss).toContain("--interactive-primary-bg");
  });
});

describe("integration: full config", () => {
  it("produces complete output with all color fields", () => {
    const fullConfig: VisorThemeConfig = {
      name: "Full Theme",
      version: 1,
      colors: {
        primary: "#2563EB",
        accent: "#7C3AED",
        neutral: "#64748B",
        background: "#FAFAFA",
        surface: "#FFFFFF",
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#0EA5E9",
      },
      "colors-dark": {
        background: "#0A0A0A",
        surface: "#1A1A1A",
      },
    };

    const output = generateThemeFromConfig(fullConfig);
    expect(output.primitivesCss).toContain("--color-primary-600");
    expect(output.primitivesCss).toContain("--color-accent-600");
    expect(output.primitivesCss).toContain("--color-neutral-500");
    expect(output.lightCss).toContain("--text-primary");
    expect(output.darkCss).toContain("--surface-page");
    expect(output.fullBundleCss.length).toBeGreaterThan(0);
  });
});

describe("integration: round-trip", () => {
  it("import YAML -> generate -> export -> re-generate produces equivalent CSS", () => {
    const config = parseConfig(MINIMAL_YAML);
    const resolved = resolveConfig(config);
    const primitives = generatePrimitives(resolved);
    const originalOutput = generateThemeFromConfig(config);

    // Export to YAML and re-import
    const exportedYaml = exportTheme(primitives, resolved);
    const reimportedConfig = parseConfig(exportedYaml);
    const roundTripOutput = generateThemeFromConfig(reimportedConfig);

    // CSS output should be identical or very close
    expect(roundTripOutput.primitivesCss).toBe(originalOutput.primitivesCss);
    expect(roundTripOutput.lightCss).toBe(originalOutput.lightCss);
    expect(roundTripOutput.darkCss).toBe(originalOutput.darkCss);
  });
});

describe("integration: status color shade scales", () => {
  const output = generateTheme(MINIMAL_YAML);

  it("produces 6-shade CSS variables for status colors", () => {
    for (const role of ["success", "warning", "error", "info"]) {
      for (const shade of [50, 100, 500, 600, 700, 900]) {
        expect(output.primitivesCss).toContain(`--color-${role}-${shade}`);
      }
    }
  });
});

describe("integration: neutral omitted uses Tailwind Gray", () => {
  it("CSS contains Tailwind Gray values when neutral is omitted", () => {
    const output = generateTheme(MINIMAL_YAML);
    // Tailwind Gray 500 is #6b7280
    expect(output.primitivesCss).toContain("--color-neutral-500");
    // Check the actual value is Tailwind Gray 500
    expect(output.primitivesCss).toContain("#6b7280");
  });
});

describe("integration: overrides", () => {
  it("replaces specific tokens in CSS output", () => {
    const configWithOverrides: VisorThemeConfig = {
      name: "Override Theme",
      version: 1,
      colors: { primary: "#2563EB" },
      overrides: {
        light: { "text-primary": "#000000" },
        dark: { "text-primary": "#FEFEFE" },
      },
    };

    const output = generateThemeFromConfig(configWithOverrides);
    // The overridden value should appear in the light CSS
    expect(output.lightCss).toContain("#000000");
    // The overridden dark value should appear in the dark CSS
    expect(output.darkCss).toContain("#FEFEFE");
  });
});

describe("integration: teal brand", () => {
  it("produces valid output for teal primary", () => {
    const tealYaml = `
name: Teal Brand
version: 1
colors:
  primary: "#1A5F7A"
    `.trim();

    const output = generateTheme(tealYaml);
    expect(output.primitivesCss).toContain("--color-primary-600");
    expect(output.lightCss).toContain("--text-primary");
    expect(output.darkCss).toContain("--interactive-primary-bg");
    expect(output.fullBundleCss.length).toBeGreaterThan(0);
  });
});

// ============================================================
// Multi-Format Color Pipeline
// ============================================================

describe("multi-format color pipeline", () => {
  it("generates theme from YAML with rgba colors", () => {
    const yaml = `
name: RGBA Theme
version: 1
colors:
  primary: "#2563EB"
  background: "rgba(250, 250, 250, 1)"
  surface: "rgba(255, 255, 255, 1)"
    `.trim();

    const output = generateTheme(yaml);
    expect(output.primitivesCss).toContain("--color-primary-600");
    expect(output.fullBundleCss.length).toBeGreaterThan(0);
  });

  it("generates theme from YAML with oklch primary", () => {
    const yaml = `
name: OKLCH Theme
version: 1
colors:
  primary: "oklch(0.5 0.2 260)"
    `.trim();

    const output = generateTheme(yaml);
    expect(output.primitivesCss).toContain("--color-primary-600");
    expect(output.lightCss).toContain("--text-primary");
  });

  it("generates theme from YAML with mixed formats", () => {
    const yaml = `
name: Mixed Theme
version: 1
colors:
  primary: "#2563EB"
  accent: "hsl(270, 60%, 50%)"
  background: "rgba(255, 255, 255, 1)"
  surface: "oklch(1.0 0 0)"
    `.trim();

    const output = generateTheme(yaml);
    expect(output.primitivesCss).toContain("--color-primary-600");
    expect(output.primitivesCss).toContain("--color-accent-600");
    expect(output.fullBundleCss.length).toBeGreaterThan(0);
  });

  it("round-trips rgba colors through export", () => {
    const yaml = `
name: Round Trip
version: 1
colors:
  primary: "rgba(37, 99, 235, 1)"
  background: "rgba(250, 250, 250, 1)"
    `.trim();

    const config = parseConfig(yaml);
    const resolved = resolveConfig(config);
    const primitives = generatePrimitives(resolved);
    const exported = exportTheme(primitives, resolved);

    // Original rgba values should be preserved in export
    expect(exported).toContain("rgba(37, 99, 235, 1)");
    expect(exported).toContain("rgba(250, 250, 250, 1)");
  });

  it("round-trips oklch colors through export", () => {
    const yaml = `
name: OKLCH Round Trip
version: 1
colors:
  primary: "oklch(0.5 0.2 260)"
    `.trim();

    const config = parseConfig(yaml);
    const resolved = resolveConfig(config);
    const primitives = generatePrimitives(resolved);
    const exported = exportTheme(primitives, resolved);

    // Original oklch value should be preserved
    expect(exported).toContain("oklch(0.5 0.2 260)");
  });
});
