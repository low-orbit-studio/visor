import { validate } from "../validate.js";
import type { VisorThemeConfig } from "../types.js";
import type { ThemeValidationResult } from "../validate.js";

// ============================================================
// Test Fixtures
// ============================================================

/** Minimal valid config */
const MINIMAL_CONFIG: VisorThemeConfig = {
  name: "Minimal",
  version: 1,
  colors: {
    primary: "#2563EB",
  },
};

/** Full valid config (resembles a real "default" theme) */
const DEFAULT_THEME: VisorThemeConfig = {
  name: "Default",
  version: 1,
  colors: {
    primary: "#2563EB",
    accent: "#8B5CF6",
    neutral: "#6B7280",
    background: "#FFFFFF",
    surface: "#FFFFFF",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#0EA5E9",
  },
  "colors-dark": {
    background: "#0a0a0a",
    surface: "#171717",
  },
  typography: {
    heading: { family: "Inter", weight: 700 },
    body: { family: "Inter", weight: 400 },
    mono: { family: "JetBrains Mono" },
  },
  spacing: { base: 4 },
  radius: { sm: 2, md: 4, lg: 8, xl: 12, pill: 9999 },
  shadows: {
    xs: "0 1px 1px 0 rgba(0, 0, 0, 0.04)",
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },
  motion: {
    "duration-fast": "100ms",
    "duration-normal": "200ms",
    "duration-slow": "500ms",
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
};

/** Neutral theme (muted gray-scale) */
const NEUTRAL_THEME: VisorThemeConfig = {
  name: "Neutral",
  version: 1,
  colors: {
    primary: "#4B5563",
    accent: "#6366F1",
    neutral: "#6B7280",
    background: "#FAFAFA",
    surface: "#FFFFFF",
  },
  typography: {
    heading: { family: "System UI", weight: 600 },
    body: { family: "System UI", weight: 400 },
  },
  radius: { sm: 4, md: 8, lg: 12, xl: 16, pill: 9999 },
};

/** Space theme (dark-leaning) */
const SPACE_THEME: VisorThemeConfig = {
  name: "Space",
  version: 1,
  colors: {
    primary: "#818CF8",
    accent: "#A78BFA",
    background: "#F8FAFC",
    surface: "#FFFFFF",
  },
  "colors-dark": {
    primary: "#818CF8",
    accent: "#A78BFA",
    background: "#020617",
    surface: "#0F172A",
  },
  typography: {
    heading: { family: "Space Grotesk", weight: 700 },
    body: { family: "Inter", weight: 400 },
  },
};

// ============================================================
// Error Rules
// ============================================================

describe("validate — error rules", () => {
  describe("structural integrity", () => {
    it("rejects non-object input", () => {
      const result = validate(null);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe("STRUCTURAL");
    });

    it("rejects string input", () => {
      const result = validate("not an object");
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe("STRUCTURAL");
    });

    it("requires name field", () => {
      const result = validate({ version: 1, colors: { primary: "#2563EB" } });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("name"))).toBe(true);
    });

    it("requires version to be 1", () => {
      const result = validate({
        name: "Test",
        version: 2,
        colors: { primary: "#2563EB" },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("version"))).toBe(
        true
      );
    });

    it("requires colors object", () => {
      const result = validate({ name: "Test", version: 1 });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes("colors"))).toBe(
        true
      );
    });

    it("requires colors.primary", () => {
      const result = validate({
        name: "Test",
        version: 1,
        colors: { accent: "#FF0000" },
      });
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes("colors.primary"))
      ).toBe(true);
    });

    it("validates hex color format", () => {
      const result = validate({
        name: "Test",
        version: 1,
        colors: { primary: "not-a-color" },
      });
      expect(result.valid).toBe(false);
    });

    it("validates motion duration pattern", () => {
      const result = validate({
        name: "Test",
        version: 1,
        colors: { primary: "#2563EB" },
        motion: { "duration-fast": "100" },
      });
      expect(result.valid).toBe(false);
      expect(
        result.errors.some(
          (e) =>
            e.code === "STRUCTURAL" && e.message.includes("duration-fast")
        )
      ).toBe(true);
    });
  });

  describe("completeness — color validation", () => {
    it("rejects invalid hex in optional color fields", () => {
      const result = validate({
        name: "Test",
        version: 1,
        colors: { primary: "#2563EB", accent: "invalid" },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "STRUCTURAL")).toBe(true);
    });

    it("rejects invalid hex in colors-dark", () => {
      const result = validate({
        name: "Test",
        version: 1,
        colors: { primary: "#2563EB" },
        "colors-dark": { background: "xyz" },
      });
      expect(result.valid).toBe(false);
    });

    it("accepts valid shorthand hex (#RGB)", () => {
      const result = validate({
        name: "Test",
        version: 1,
        colors: { primary: "#26E" },
      });
      expect(result.valid).toBe(true);
    });

    it("accepts valid 8-digit hex (#RRGGBBAA)", () => {
      const result = validate({
        name: "Test",
        version: 1,
        colors: { primary: "#2563EB80" },
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("completeness — radius", () => {
    it("rejects negative radius values", () => {
      const result = validate({
        name: "Test",
        version: 1,
        colors: { primary: "#2563EB" },
        radius: { sm: -1 },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "INVALID_RADIUS")).toBe(true);
    });

    it("accepts zero radius", () => {
      const result = validate({
        name: "Test",
        version: 1,
        colors: { primary: "#2563EB" },
        radius: { sm: 0, md: 0, lg: 0, xl: 0 },
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("completeness — shadows", () => {
    it("rejects empty shadow strings", () => {
      const result = validate({
        name: "Test",
        version: 1,
        colors: { primary: "#2563EB" },
        shadows: { sm: "" },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "INVALID_SHADOW")).toBe(true);
    });
  });

  describe("completeness — typography weights", () => {
    it("rejects weight below 100", () => {
      const result = validate({
        name: "Test",
        version: 1,
        colors: { primary: "#2563EB" },
        typography: { heading: { weight: 50 } },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "INVALID_WEIGHT")).toBe(true);
    });

    it("rejects weight above 900", () => {
      const result = validate({
        name: "Test",
        version: 1,
        colors: { primary: "#2563EB" },
        typography: { body: { weight: 1000 } },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "INVALID_WEIGHT")).toBe(true);
    });

    it("rejects empty font family", () => {
      const result = validate({
        name: "Test",
        version: 1,
        colors: { primary: "#2563EB" },
        typography: { heading: { family: "" } },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "INVALID_FONT_FAMILY")).toBe(
        true
      );
    });

    it("rejects whitespace-only font family", () => {
      const result = validate({
        name: "Test",
        version: 1,
        colors: { primary: "#2563EB" },
        typography: { body: { family: "   " } },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "INVALID_FONT_FAMILY")).toBe(
        true
      );
    });
  });

  describe("completeness — spacing", () => {
    it("rejects spacing base < 1", () => {
      const result = validate({
        name: "Test",
        version: 1,
        colors: { primary: "#2563EB" },
        spacing: { base: 0 },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === "INVALID_SPACING")).toBe(
        true
      );
    });
  });

  describe("type scale coherence", () => {
    it("errors when heading weight < body weight", () => {
      const result = validate({
        name: "Test",
        version: 1,
        colors: { primary: "#2563EB" },
        typography: {
          heading: { weight: 300 },
          body: { weight: 500 },
        },
      });
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.code === "TYPE_SCALE_INCOHERENT")
      ).toBe(true);
    });

    it("accepts heading weight == body weight", () => {
      const result = validate({
        name: "Test",
        version: 1,
        colors: { primary: "#2563EB" },
        typography: {
          heading: { weight: 400 },
          body: { weight: 400 },
        },
      });
      expect(result.valid).toBe(true);
    });

    it("accepts heading weight > body weight", () => {
      const result = validate({
        name: "Test",
        version: 1,
        colors: { primary: "#2563EB" },
        typography: {
          heading: { weight: 700 },
          body: { weight: 400 },
        },
      });
      expect(result.valid).toBe(true);
    });

    it("skips coherence check when only one weight is provided", () => {
      const result = validate({
        name: "Test",
        version: 1,
        colors: { primary: "#2563EB" },
        typography: {
          heading: { weight: 300 },
        },
      });
      expect(result.valid).toBe(true);
    });
  });
});

// ============================================================
// Warning Rules
// ============================================================

describe("validate — warning rules", () => {
  describe("WCAG contrast", () => {
    it("warns when primary has poor contrast on light background", () => {
      // Yellow on white — very low contrast
      const result = validate({
        name: "Low Contrast",
        version: 1,
        colors: {
          primary: "#FFFF00",
          background: "#FFFFFF",
        },
      });
      expect(result.valid).toBe(true);
      expect(
        result.warnings.some(
          (w) =>
            w.code === "WCAG_CONTRAST" &&
            w.message.includes("Light mode") &&
            w.message.includes("primary")
        )
      ).toBe(true);
    });

    it("warns when dark mode text has poor contrast", () => {
      // Light background in dark mode — text contrast will be bad
      const result = validate({
        name: "Bad Dark",
        version: 1,
        colors: {
          primary: "#2563EB",
        },
        "colors-dark": {
          background: "#FFFFFF",
          surface: "#F0F0F0",
        },
      });
      expect(result.valid).toBe(true);
      expect(
        result.warnings.some(
          (w) =>
            w.code === "WCAG_CONTRAST" && w.message.includes("Dark mode")
        )
      ).toBe(true);
    });

    it("no contrast warnings for well-configured theme", () => {
      const result = validate(DEFAULT_THEME);
      expect(result.valid).toBe(true);
      // Default theme is well-designed, should have minimal/no contrast issues
      const textContrastWarnings = result.warnings.filter(
        (w) =>
          w.code === "WCAG_CONTRAST" &&
          w.message.includes("text-primary")
      );
      expect(textContrastWarnings.length).toBe(0);
    });
  });

  describe("primary/accent similarity", () => {
    it("warns when primary and accent are too similar", () => {
      const result = validate({
        name: "Similar Colors",
        version: 1,
        colors: {
          primary: "#2563EB",
          accent: "#2564EC", // nearly identical
        },
      });
      expect(result.valid).toBe(true);
      expect(
        result.warnings.some((w) => w.code === "COLOR_SIMILARITY")
      ).toBe(true);
    });

    it("no similarity warning when accent is omitted (defaults to primary)", () => {
      const result = validate(MINIMAL_CONFIG);
      expect(result.valid).toBe(true);
      expect(
        result.warnings.some((w) => w.code === "COLOR_SIMILARITY")
      ).toBe(false);
    });

    it("no similarity warning when colors are distinct", () => {
      const result = validate({
        name: "Distinct",
        version: 1,
        colors: {
          primary: "#2563EB",
          accent: "#EC4899", // pink — very different from blue
        },
      });
      expect(result.valid).toBe(true);
      expect(
        result.warnings.some((w) => w.code === "COLOR_SIMILARITY")
      ).toBe(false);
    });
  });

  describe("incomplete shadows", () => {
    it("warns when shadow scale is partially defined", () => {
      const result = validate({
        name: "Partial Shadows",
        version: 1,
        colors: { primary: "#2563EB" },
        shadows: {
          sm: "0 1px 2px rgba(0,0,0,0.05)",
          md: "0 4px 6px rgba(0,0,0,0.1)",
        },
      });
      expect(result.valid).toBe(true);
      expect(
        result.warnings.some((w) => w.code === "INCOMPLETE_SHADOWS")
      ).toBe(true);
    });

    it("no shadow warning when all shadows defined", () => {
      const result = validate(DEFAULT_THEME);
      expect(result.valid).toBe(true);
      expect(
        result.warnings.some((w) => w.code === "INCOMPLETE_SHADOWS")
      ).toBe(false);
    });

    it("no shadow warning when no shadows defined", () => {
      const result = validate(MINIMAL_CONFIG);
      expect(result.valid).toBe(true);
      expect(
        result.warnings.some((w) => w.code === "INCOMPLETE_SHADOWS")
      ).toBe(false);
    });
  });

  describe("inconsistent radius scale", () => {
    it("warns when radius scale is not monotonically increasing", () => {
      const result = validate({
        name: "Bad Radius",
        version: 1,
        colors: { primary: "#2563EB" },
        radius: { sm: 8, md: 4, lg: 12, xl: 16 },
      });
      expect(result.valid).toBe(true);
      expect(
        result.warnings.some((w) => w.code === "RADIUS_SCALE")
      ).toBe(true);
    });

    it("no radius warning for monotonically increasing scale", () => {
      const result = validate(DEFAULT_THEME);
      expect(result.valid).toBe(true);
      expect(
        result.warnings.some((w) => w.code === "RADIUS_SCALE")
      ).toBe(false);
    });
  });
});

// ============================================================
// Known-Good Themes
// ============================================================

describe("validate — known-good themes", () => {
  it("validates minimal config as valid", () => {
    const result = validate(MINIMAL_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("validates default theme as valid", () => {
    const result = validate(DEFAULT_THEME);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("validates neutral theme as valid", () => {
    const result = validate(NEUTRAL_THEME);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("validates space theme as valid", () => {
    const result = validate(SPACE_THEME);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ============================================================
// Intentionally Broken Themes
// ============================================================

describe("validate — intentionally broken themes", () => {
  it("catches multiple errors in a single config", () => {
    const result = validate({
      name: "",
      version: 2,
      colors: { primary: "not-hex" },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it("catches missing name and invalid version together", () => {
    const result = validate({
      version: 0,
      colors: { primary: "#2563EB" },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes("name"))).toBe(true);
    expect(result.errors.some((e) => e.message.includes("version"))).toBe(
      true
    );
  });

  it("catches invalid dark mode colors", () => {
    const result = validate({
      name: "Bad Dark",
      version: 1,
      colors: { primary: "#2563EB" },
      "colors-dark": { primary: "not-a-color" },
    });
    expect(result.valid).toBe(false);
  });

  it("catches type scale incoherence with other errors", () => {
    const result = validate({
      name: "Multi-Error",
      version: 1,
      colors: { primary: "#2563EB" },
      typography: {
        heading: { weight: 200 },
        body: { weight: 700 },
      },
      radius: { sm: -5 },
    });
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.code === "TYPE_SCALE_INCOHERENT")
    ).toBe(true);
    expect(
      result.errors.some((e) => e.code === "INVALID_RADIUS")
    ).toBe(true);
  });
});

// ============================================================
// Output Structure
// ============================================================

describe("validate — output structure", () => {
  it("returns JSON-serializable results", () => {
    const result = validate(DEFAULT_THEME);
    const json = JSON.stringify(result);
    const parsed = JSON.parse(json) as ThemeValidationResult;
    expect(parsed.valid).toBe(result.valid);
    expect(parsed.errors).toEqual(result.errors);
    expect(parsed.warnings).toEqual(result.warnings);
  });

  it("includes proper issue structure for errors", () => {
    const result = validate({ name: "", version: 2 });
    for (const error of result.errors) {
      expect(error).toHaveProperty("severity", "error");
      expect(error).toHaveProperty("code");
      expect(error).toHaveProperty("message");
      expect(typeof error.code).toBe("string");
      expect(typeof error.message).toBe("string");
    }
  });

  it("includes proper issue structure for warnings", () => {
    const result = validate({
      name: "Warn Test",
      version: 1,
      colors: {
        primary: "#2563EB",
        accent: "#2564EC",
      },
    });
    for (const warning of result.warnings) {
      expect(warning).toHaveProperty("severity", "warning");
      expect(warning).toHaveProperty("code");
      expect(warning).toHaveProperty("message");
    }
  });

  it("does not run warnings when errors exist", () => {
    const result = validate({
      name: "Bad",
      version: 1,
      colors: { primary: "#2563EB" },
      typography: {
        heading: { weight: 100 },
        body: { weight: 500 },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });
});

// ============================================================
// Multi-Format Color Support
// ============================================================

describe("validate — multi-format colors", () => {
  it("accepts rgba color values", () => {
    const result = validate({
      name: "RGBA Theme",
      version: 1,
      colors: {
        primary: "#2563EB",
        background: "rgba(255, 255, 255, 1)",
      },
    });
    expect(result.valid).toBe(true);
  });

  it("accepts hsla color values", () => {
    const result = validate({
      name: "HSLA Theme",
      version: 1,
      colors: {
        primary: "hsl(220, 83%, 53%)",
      },
    });
    expect(result.valid).toBe(true);
  });

  it("accepts oklch color values", () => {
    const result = validate({
      name: "OKLCH Theme",
      version: 1,
      colors: {
        primary: "oklch(0.5 0.2 260)",
      },
    });
    expect(result.valid).toBe(true);
  });

  it("accepts mixed format colors", () => {
    const result = validate({
      name: "Mixed Theme",
      version: 1,
      colors: {
        primary: "#2563EB",
        accent: "oklch(0.6 0.15 300)",
        background: "rgba(250, 250, 250, 1)",
        surface: "hsl(0, 0%, 100%)",
      },
    });
    expect(result.valid).toBe(true);
  });

  it("accepts rgba in dark mode overrides", () => {
    const result = validate({
      name: "Dark RGBA",
      version: 1,
      colors: { primary: "#2563EB" },
      "colors-dark": {
        background: "rgba(10, 10, 10, 1)",
        surface: "rgba(26, 26, 26, 1)",
      },
    });
    expect(result.valid).toBe(true);
  });

  it("still rejects invalid color strings", () => {
    const result = validate({
      name: "Bad Colors",
      version: 1,
      colors: {
        primary: "not-valid",
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "INVALID_COLOR" || e.code === "STRUCTURAL")).toBe(true);
  });

  it("runs contrast warnings for non-hex colors", () => {
    // This should still produce contrast warnings for low-contrast combos
    const result = validate({
      name: "Low Contrast",
      version: 1,
      colors: {
        primary: "hsl(0, 0%, 90%)", // very light gray as primary
        background: "hsl(0, 0%, 95%)", // almost white background
      },
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.code === "WCAG_CONTRAST")).toBe(true);
  });
});
