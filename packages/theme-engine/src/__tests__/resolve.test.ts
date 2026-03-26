import { resolveConfig } from "../resolve.js";
import type { VisorThemeConfig } from "../types.js";

describe("resolveConfig", () => {
  const minimalConfig: VisorThemeConfig = {
    name: "Test",
    version: 1,
    colors: { primary: "#2563EB" },
  };

  it("resolves all fields from minimal config", () => {
    const resolved = resolveConfig(minimalConfig);

    expect(resolved.name).toBe("Test");
    expect(resolved.version).toBe(1);
    expect(resolved.colors.primary).toBe("#2563EB");
    expect(resolved.typography).toBeDefined();
    expect(resolved.spacing).toBeDefined();
    expect(resolved.radius).toBeDefined();
    expect(resolved.shadows).toBeDefined();
    expect(resolved.motion).toBeDefined();
  });

  it("defaults accent to primary", () => {
    const resolved = resolveConfig(minimalConfig);
    expect(resolved.colors.accent).toBe("#2563EB");
  });

  it("defaults neutral to null", () => {
    const resolved = resolveConfig(minimalConfig);
    expect(resolved.colors.neutral).toBeNull();
  });

  it("defaults background and surface to #FFFFFF", () => {
    const resolved = resolveConfig(minimalConfig);
    expect(resolved.colors.background).toBe("#FFFFFF");
    expect(resolved.colors.surface).toBe("#FFFFFF");
  });

  it("fills Tailwind default status colors", () => {
    const resolved = resolveConfig(minimalConfig);
    expect(resolved.colors.success).toBe("#22C55E");
    expect(resolved.colors.warning).toBe("#F59E0B");
    expect(resolved.colors.error).toBe("#EF4444");
    expect(resolved.colors.info).toBe("#0EA5E9");
  });

  it("defaults typography to system font stacks", () => {
    const resolved = resolveConfig(minimalConfig);
    expect(resolved.typography.heading.family).toContain("BlinkMacSystemFont");
    expect(resolved.typography.body.family).toContain("BlinkMacSystemFont");
    expect(resolved.typography.mono.family).toContain("SF Mono");
    expect(resolved.typography.heading.weight).toBe(600);
    expect(resolved.typography.body.weight).toBe(400);
  });

  it("defaults spacing.base to 4", () => {
    const resolved = resolveConfig(minimalConfig);
    expect(resolved.spacing.base).toBe(4);
  });

  it("preserves provided values instead of overwriting", () => {
    const custom: VisorThemeConfig = {
      name: "Custom",
      version: 1,
      colors: {
        primary: "#FF0000",
        accent: "#00FF00",
        neutral: "#888888",
        background: "#FAFAFA",
        surface: "#F5F5F5",
        success: "#10B981",
        warning: "#FBBF24",
        error: "#DC2626",
        info: "#3B82F6",
      },
      typography: {
        heading: { family: "Inter, sans-serif", weight: 700 },
        body: { family: "Lato, sans-serif", weight: 300 },
        mono: { family: "JetBrains Mono, monospace" },
      },
      spacing: { base: 8 },
    };

    const resolved = resolveConfig(custom);

    expect(resolved.colors.primary).toBe("#FF0000");
    expect(resolved.colors.accent).toBe("#00FF00");
    expect(resolved.colors.neutral).toBe("#888888");
    expect(resolved.colors.background).toBe("#FAFAFA");
    expect(resolved.colors.surface).toBe("#F5F5F5");
    expect(resolved.colors.success).toBe("#10B981");
    expect(resolved.colors.warning).toBe("#FBBF24");
    expect(resolved.colors.error).toBe("#DC2626");
    expect(resolved.colors.info).toBe("#3B82F6");
    expect(resolved.typography.heading.family).toBe("Inter, sans-serif");
    expect(resolved.typography.heading.weight).toBe(700);
    expect(resolved.typography.body.family).toBe("Lato, sans-serif");
    expect(resolved.typography.body.weight).toBe(300);
    expect(resolved.typography.mono.family).toBe("JetBrains Mono, monospace");
    expect(resolved.spacing.base).toBe(8);
  });

  it("passes colors-dark through as-is", () => {
    const config: VisorThemeConfig = {
      name: "Dark Override",
      version: 1,
      colors: { primary: "#2563EB" },
      "colors-dark": {
        background: "#1A1A2E",
        surface: "#16213E",
      },
    };

    const resolved = resolveConfig(config);
    expect(resolved["colors-dark"]).toEqual({
      background: "#1A1A2E",
      surface: "#16213E",
    });
  });
});
