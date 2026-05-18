import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { validate } from "../validate.js";
import { parseConfig } from "../pipeline.js";
import type { VisorThemeConfig } from "../types.js";
import type { ThemeValidationResult } from "../validate.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

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
    "letter-spacing": { tight: "-0.05em", normal: "0", wide: "0.1em" },
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

    // VI-347: Expanded text-level coverage. Tertiary/secondary/status text
    // tokens are now validated against bg + surface in both modes (28 checks
    // per theme). Use overrides to force specific failure modes.

    it("warns when text-tertiary fails AA against light background", () => {
      const result = validate({
        name: "Bad Tertiary Light",
        version: 1,
        colors: { primary: "#2563EB", background: "#FFFFFF" },
        overrides: {
          light: { "text-tertiary": "#CCCCCC" }, // ~1.6:1 on white
        },
      });
      expect(result.valid).toBe(true);
      expect(
        result.warnings.some(
          (w) =>
            w.code === "WCAG_CONTRAST" &&
            w.message.includes("Light mode") &&
            w.message.includes("text-tertiary") &&
            w.message.includes("background")
        )
      ).toBe(true);
    });

    it("warns when text-secondary fails AA against light surface", () => {
      const result = validate({
        name: "Bad Secondary Surface",
        version: 1,
        colors: { primary: "#2563EB", surface: "#FFFFFF" },
        overrides: {
          light: { "text-secondary": "#DDDDDD" }, // ~1.4:1 on white
        },
      });
      expect(result.valid).toBe(true);
      expect(
        result.warnings.some(
          (w) =>
            w.code === "WCAG_CONTRAST" &&
            w.message.includes("Light mode") &&
            w.message.includes("text-secondary") &&
            w.message.includes("surface")
        )
      ).toBe(true);
    });

    it("warns when text-error fails AA against light surface", () => {
      const result = validate({
        name: "Bad Error Surface",
        version: 1,
        colors: { primary: "#2563EB", surface: "#FFFFFF" },
        overrides: {
          light: { "text-error": "#FFAAAA" }, // light red, fails AA on white
        },
      });
      expect(result.valid).toBe(true);
      expect(
        result.warnings.some(
          (w) =>
            w.code === "WCAG_CONTRAST" &&
            w.message.includes("Light mode") &&
            w.message.includes("text-error") &&
            w.message.includes("surface")
        )
      ).toBe(true);
    });

    it("warns when text-warning fails AA against light background", () => {
      const result = validate({
        name: "Bad Warning Bg",
        version: 1,
        colors: { primary: "#2563EB", background: "#FFFFFF" },
        overrides: {
          light: { "text-warning": "#FFDD00" }, // bright yellow on white, very low contrast
        },
      });
      expect(result.valid).toBe(true);
      expect(
        result.warnings.some(
          (w) =>
            w.code === "WCAG_CONTRAST" &&
            w.message.includes("Light mode") &&
            w.message.includes("text-warning") &&
            w.message.includes("background")
        )
      ).toBe(true);
    });

    it("warns when text-success fails AA in dark mode against surface", () => {
      const result = validate({
        name: "Bad Success Dark Surface",
        version: 1,
        colors: { primary: "#2563EB" },
        "colors-dark": { background: "#0a0a0a", surface: "#171717" },
        overrides: {
          dark: { "text-success": "#1a3a1a" }, // very dark green on dark surface
        },
      });
      expect(result.valid).toBe(true);
      expect(
        result.warnings.some(
          (w) =>
            w.code === "WCAG_CONTRAST" &&
            w.message.includes("Dark mode") &&
            w.message.includes("text-success") &&
            w.message.includes("surface")
        )
      ).toBe(true);
    });

    it("warns when text-info fails AA in dark mode against background", () => {
      const result = validate({
        name: "Bad Info Dark Bg",
        version: 1,
        colors: { primary: "#2563EB" },
        "colors-dark": { background: "#0a0a0a", surface: "#171717" },
        overrides: {
          dark: { "text-info": "#1a1a3a" }, // very dark blue on dark bg
        },
      });
      expect(result.valid).toBe(true);
      expect(
        result.warnings.some(
          (w) =>
            w.code === "WCAG_CONTRAST" &&
            w.message.includes("Dark mode") &&
            w.message.includes("text-info") &&
            w.message.includes("background")
        )
      ).toBe(true);
    });

    it("does NOT validate text-disabled (WCAG 1.4.3 exempt)", () => {
      // Override text-disabled to a deliberately low-contrast value.
      // The validator must not emit a WCAG_CONTRAST warning for text-disabled.
      const result = validate({
        name: "Disabled Exempt",
        version: 1,
        colors: { primary: "#2563EB", background: "#FFFFFF", surface: "#FFFFFF" },
        overrides: {
          light: { "text-disabled": "#FAFAFA" }, // ~1.04:1 on white
          dark: { "text-disabled": "#0b0b0b" }, // ~1.04:1 on dark bg
        },
      });
      expect(result.valid).toBe(true);
      const disabledWarnings = result.warnings.filter(
        (w) =>
          w.code === "WCAG_CONTRAST" && w.message.includes("text-disabled")
      );
      expect(disabledWarnings).toHaveLength(0);
    });

    it("does NOT validate text-link / text-inverse (out of scope per VI-347)", () => {
      // Override link/inverse to deliberately low contrast.
      // These are explicitly out of scope — link sits on different surfaces
      // contextually, inverse sits on inverted backgrounds.
      const result = validate({
        name: "Link Inverse Exempt",
        version: 1,
        colors: { primary: "#2563EB", background: "#FFFFFF", surface: "#FFFFFF" },
        overrides: {
          light: {
            "text-link": "#F0F0F0",
            "text-inverse": "#FFFFFF",
            "text-inverse-secondary": "#FAFAFA",
            "text-link-hover": "#EEEEEE",
          },
        },
      });
      expect(result.valid).toBe(true);
      const linkWarnings = result.warnings.filter(
        (w) =>
          w.code === "WCAG_CONTRAST" &&
          (w.message.includes("text-link") ||
            w.message.includes("text-inverse"))
      );
      expect(linkWarnings).toHaveLength(0);
    });

    it("emits 4 distinct checks per failing token (bg + surface, light + dark)", () => {
      // text-tertiary set to a value that fails AA on white, but the dark
      // value is left to derive from neutral-400 (which passes AA against
      // the default dark bg/surface). Expect exactly 2 warnings (light bg + light surface).
      const result = validate({
        name: "Tertiary Quad Check",
        version: 1,
        colors: { primary: "#2563EB", background: "#FFFFFF", surface: "#FFFFFF" },
        overrides: {
          light: { "text-tertiary": "#DDDDDD" },
        },
      });
      const tertiaryWarnings = result.warnings.filter(
        (w) =>
          w.code === "WCAG_CONTRAST" && w.message.includes("text-tertiary")
      );
      expect(tertiaryWarnings).toHaveLength(2);
      expect(
        tertiaryWarnings.some((w) => w.message.includes("background"))
      ).toBe(true);
      expect(
        tertiaryWarnings.some((w) => w.message.includes("surface"))
      ).toBe(true);
      expect(
        tertiaryWarnings.every((w) => w.message.includes("Light mode"))
      ).toBe(true);
    });

    it("all stock-style text levels pass AA for a well-configured theme", () => {
      // VI-346 rebalanced text-secondary/tertiary to fixed-L shades so AA
      // holds by default. DEFAULT_THEME should produce zero text-* contrast
      // warnings across all 7 in-scope tokens (28 checks).
      const result = validate(DEFAULT_THEME);
      expect(result.valid).toBe(true);
      const textWarnings = result.warnings.filter(
        (w) =>
          w.code === "WCAG_CONTRAST" &&
          (w.message.includes("text-primary") ||
            w.message.includes("text-secondary") ||
            w.message.includes("text-tertiary") ||
            w.message.includes("text-error") ||
            w.message.includes("text-warning") ||
            w.message.includes("text-success") ||
            w.message.includes("text-info"))
      );
      expect(textWarnings).toHaveLength(0);
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

// ============================================================
// Letter-Spacing Validation
// ============================================================

describe("validate — typography.slots", () => {
  it("accepts partial Material-slot overrides", () => {
    const result = validate({
      name: "Slots Test",
      version: 1,
      colors: { primary: "#2563EB" },
      typography: {
        slots: {
          displayLarge: { size: 56, weight: 500, "letter-spacing": -0.5 },
          titleMedium: { weight: 600 },
          bodyLarge: { "letter-spacing": 0.15 },
        },
      },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects unknown slot names", () => {
    const result = validate({
      name: "Slots Test",
      version: 1,
      colors: { primary: "#2563EB" },
      typography: { slots: { displayHuge: { size: 72 } } },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.message).toMatch(/typography\.slots\.displayHuge/);
  });

  it("rejects unknown override fields", () => {
    const result = validate({
      name: "Slots Test",
      version: 1,
      colors: { primary: "#2563EB" },
      // @ts-expect-error — exercising schema rejection
      typography: { slots: { bodyLarge: { lineHeight: 1.4 } } },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.message).toMatch(/lineHeight/);
  });

  it("rejects out-of-range weight", () => {
    const result = validate({
      name: "Slots Test",
      version: 1,
      colors: { primary: "#2563EB" },
      typography: { slots: { titleMedium: { weight: 950 } } },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.message).toMatch(/between 100 and 900/);
  });

  it("rejects non-numeric size", () => {
    const result = validate({
      name: "Slots Test",
      version: 1,
      colors: { primary: "#2563EB" },
      // @ts-expect-error — exercising schema rejection
      typography: { slots: { bodyLarge: { size: "16px" } } },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.message).toMatch(/positive number/);
  });
});

describe("validate — letter-spacing", () => {
  it("accepts valid em values", () => {
    const result = validate({
      name: "LS Test",
      version: 1,
      colors: { primary: "#2563EB" },
      typography: { "letter-spacing": { tight: "-0.05em", normal: "0", wide: "0.1em" } },
    });
    expect(result.valid).toBe(true);
  });

  it("accepts valid rem and px values", () => {
    const result = validate({
      name: "LS Test",
      version: 1,
      colors: { primary: "#2563EB" },
      typography: { "letter-spacing": { tight: "-0.5px", wide: "0.05rem" } },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects invalid letter-spacing values", () => {
    const result = validate({
      name: "LS Test",
      version: 1,
      colors: { primary: "#2563EB" },
      typography: { "letter-spacing": { tight: "loose" } },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "INVALID_LETTER_SPACING")).toBe(true);
  });

  it("rejects empty letter-spacing string", () => {
    const result = validate({
      name: "LS Test",
      version: 1,
      colors: { primary: "#2563EB" },
      typography: { "letter-spacing": { normal: "" } },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "INVALID_LETTER_SPACING")).toBe(true);
  });
});

// ============================================================
// Motion Easing Validation
// ============================================================

describe("validate — motion easing", () => {
  it("accepts named keyword 'ease'", () => {
    const result = validate({
      name: "Easing Test",
      version: 1,
      colors: { primary: "#2563EB" },
      motion: { easing: "ease" },
    });
    expect(result.valid).toBe(true);
  });

  it("accepts named keyword 'linear'", () => {
    const result = validate({
      name: "Easing Test",
      version: 1,
      colors: { primary: "#2563EB" },
      motion: { easing: "linear" },
    });
    expect(result.valid).toBe(true);
  });

  it("accepts cubic-bezier function", () => {
    const result = validate({
      name: "Easing Test",
      version: 1,
      colors: { primary: "#2563EB" },
      motion: { easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
    });
    expect(result.valid).toBe(true);
  });

  it("accepts steps function", () => {
    const result = validate({
      name: "Easing Test",
      version: 1,
      colors: { primary: "#2563EB" },
      motion: { easing: "steps(4, end)" },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects invalid easing value", () => {
    const result = validate({
      name: "Easing Test",
      version: 1,
      colors: { primary: "#2563EB" },
      motion: { easing: "bouncy" },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "INVALID_EASING")).toBe(true);
  });
});

// ============================================================
// Motion Duration Runtime Validation
// ============================================================

describe("validate — motion duration runtime", () => {
  it("accepts valid duration ordering", () => {
    const result = validate({
      name: "Duration Test",
      version: 1,
      colors: { primary: "#2563EB" },
      motion: { "duration-fast": "100ms", "duration-normal": "200ms", "duration-slow": "500ms" },
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.code === "DURATION_ORDER")).toBe(false);
  });

  it("warns when fast >= normal", () => {
    const result = validate({
      name: "Duration Test",
      version: 1,
      colors: { primary: "#2563EB" },
      motion: { "duration-fast": "300ms", "duration-normal": "200ms", "duration-slow": "500ms" },
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.code === "DURATION_ORDER" && w.message.includes("fast"))).toBe(true);
  });

  it("warns when normal >= slow", () => {
    const result = validate({
      name: "Duration Test",
      version: 1,
      colors: { primary: "#2563EB" },
      motion: { "duration-fast": "100ms", "duration-normal": "600ms", "duration-slow": "500ms" },
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.code === "DURATION_ORDER" && w.message.includes("normal"))).toBe(true);
  });

  it("errors when duration exceeds 10000ms", () => {
    const result = validate({
      name: "Duration Test",
      version: 1,
      colors: { primary: "#2563EB" },
      motion: { "duration-slow": "15000ms" },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "INVALID_DURATION")).toBe(true);
  });

  it("accepts 0ms duration as valid format but errors on range", () => {
    const result = validate({
      name: "Duration Test",
      version: 1,
      colors: { primary: "#2563EB" },
      motion: { "duration-fast": "0ms" },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "INVALID_DURATION")).toBe(true);
  });

  it("accepts boundary value of 10000ms", () => {
    const result = validate({
      name: "Duration Test",
      version: 1,
      colors: { primary: "#2563EB" },
      motion: { "duration-slow": "10000ms" },
    });
    expect(result.valid).toBe(true);
  });
});

// ============================================================
// Override Validation
// ============================================================

describe("validate — overrides", () => {
  it("accepts valid overrides with known semantic tokens", () => {
    const result = validate({
      name: "Override Test",
      version: 1,
      colors: { primary: "#2563EB" },
      overrides: {
        light: { "text-primary": "rgba(0, 0, 0, 0.95)" },
        dark: { "surface-page": "#000000" },
      },
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.code === "UNKNOWN_OVERRIDE_KEY")).toBe(false);
  });

  it("errors on empty override values", () => {
    const result = validate({
      name: "Override Test",
      version: 1,
      colors: { primary: "#2563EB" },
      overrides: { light: { "text-primary": "" } },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "INVALID_OVERRIDE")).toBe(true);
  });

  it("warns on unknown override keys", () => {
    const result = validate({
      name: "Override Test",
      version: 1,
      colors: { primary: "#2563EB" },
      overrides: { light: { "custom-thing": "#FF0000" } },
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.code === "UNKNOWN_OVERRIDE_KEY")).toBe(true);
  });

  it("allows known semantic tokens without warnings", () => {
    const result = validate({
      name: "Override Test",
      version: 1,
      colors: { primary: "#2563EB" },
      overrides: {
        dark: {
          "text-primary": "rgba(255, 255, 255, 0.95)",
          "surface-card": "rgba(255, 255, 255, 0.04)",
          "border-default": "rgba(255, 255, 255, 0.06)",
          "interactive-primary-bg": "#5555FF",
        },
      },
    });
    expect(result.valid).toBe(true);
    expect(result.warnings.filter((w) => w.code === "UNKNOWN_OVERRIDE_KEY")).toHaveLength(0);
  });
});

// ============================================================
// Resolved Completeness Contract
// ============================================================

describe("validate — resolved completeness", () => {
  it("minimal config passes completeness (defaults fill gaps)", () => {
    const result = validate({
      name: "Minimal",
      version: 1,
      colors: { primary: "#2563EB" },
    });
    expect(result.valid).toBe(true);
    expect(result.errors.some((e) => e.code === "INCOMPLETE_RESOLVED")).toBe(false);
  });

  it("fully specified config passes completeness", () => {
    const result = validate(DEFAULT_THEME);
    expect(result.valid).toBe(true);
    expect(result.errors.some((e) => e.code === "INCOMPLETE_RESOLVED")).toBe(false);
  });
});

// ============================================================
// Unknown Key Rejection
// ============================================================

describe("validate — unknown keys", () => {
  it("rejects unknown top-level key", () => {
    const result = validate({
      name: "Test",
      version: 1,
      colors: { primary: "#2563EB" },
      colour: "#FF0000",
    } as unknown);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "STRUCTURAL" && e.message.includes("colour"))).toBe(true);
  });

  it("rejects unknown color key", () => {
    const result = validate({
      name: "Test",
      version: 1,
      colors: { primary: "#2563EB", brand: "#FF0000" },
    } as unknown);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "STRUCTURAL" && e.message.includes("brand"))).toBe(true);
  });

  it("rejects unknown colors-dark key", () => {
    const result = validate({
      name: "Test",
      version: 1,
      colors: { primary: "#2563EB" },
      "colors-dark": { brand: "#FF0000" },
    } as unknown);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "STRUCTURAL" && e.message.includes("brand"))).toBe(true);
  });

  it("rejects unknown typography key", () => {
    const result = validate({
      name: "Test",
      version: 1,
      colors: { primary: "#2563EB" },
      typography: { fancy: { family: "Inter" } },
    } as unknown);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "STRUCTURAL" && e.message.includes("fancy"))).toBe(true);
  });

  it("accepts display typography key", () => {
    const result = validate({
      name: "Test",
      version: 1,
      colors: { primary: "#2563EB" },
      typography: { display: { family: "Playfair Display", weight: 400 } },
    } as unknown);
    expect(result.valid).toBe(true);
  });

  it("rejects unknown radius key", () => {
    const result = validate({
      name: "Test",
      version: 1,
      colors: { primary: "#2563EB" },
      radius: { sm: 2, xxl: 32 },
    } as unknown);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "STRUCTURAL" && e.message.includes("xxl"))).toBe(true);
  });

  it("rejects unknown motion key", () => {
    const result = validate({
      name: "Test",
      version: 1,
      colors: { primary: "#2563EB" },
      motion: { "duration-fast": "100ms", bounce: "true" },
    } as unknown);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "STRUCTURAL" && e.message.includes("bounce"))).toBe(true);
  });

  it("rejects unknown shadow key", () => {
    const result = validate({
      name: "Test",
      version: 1,
      colors: { primary: "#2563EB" },
      shadows: { glow: "0 0 20px rgba(0,0,0,0.5)" },
    } as unknown);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "STRUCTURAL" && e.message.includes("glow"))).toBe(true);
  });

  it("rejects unknown overrides key", () => {
    const result = validate({
      name: "Test",
      version: 1,
      colors: { primary: "#2563EB" },
      overrides: { light: { "text-primary": "#000" }, midnight: { "text-primary": "#FFF" } },
    } as unknown);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "STRUCTURAL" && e.message.includes("midnight"))).toBe(true);
  });
});

// ============================================================
// Status Colors
// ============================================================

describe("validate — status colors", () => {
  it("accepts valid status colors", () => {
    const result = validate({
      name: "Status Test",
      version: 1,
      colors: {
        primary: "#2563EB",
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#0EA5E9",
      },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects invalid success color", () => {
    const result = validate({
      name: "Status Test",
      version: 1,
      colors: { primary: "#2563EB", success: "green" },
    });
    expect(result.valid).toBe(false);
  });

  it("rejects invalid warning color", () => {
    const result = validate({
      name: "Status Test",
      version: 1,
      colors: { primary: "#2563EB", warning: "amber" },
    });
    expect(result.valid).toBe(false);
  });

  it("rejects invalid error color", () => {
    const result = validate({
      name: "Status Test",
      version: 1,
      colors: { primary: "#2563EB", error: "red" },
    });
    expect(result.valid).toBe(false);
  });

  it("rejects invalid info color", () => {
    const result = validate({
      name: "Status Test",
      version: 1,
      colors: { primary: "#2563EB", info: "blue" },
    });
    expect(result.valid).toBe(false);
  });
});

// ============================================================
// Radius Pill
// ============================================================

describe("validate — radius.pill", () => {
  it("accepts pill value of 9999", () => {
    const result = validate({
      name: "Pill Test",
      version: 1,
      colors: { primary: "#2563EB" },
      radius: { pill: 9999 },
    });
    expect(result.valid).toBe(true);
  });

  it("rejects negative pill value", () => {
    const result = validate({
      name: "Pill Test",
      version: 1,
      colors: { primary: "#2563EB" },
      radius: { pill: -1 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "INVALID_RADIUS")).toBe(true);
  });
});

// ============================================================
// Dark/Light Color Parity
// ============================================================

describe("validate — dark/light color parity", () => {
  it("warns when custom colors set but no colors-dark section", () => {
    const result = validate({
      name: "Parity Test",
      version: 1,
      colors: { primary: "#2563EB", accent: "#8B5CF6" },
    });
    expect(result.valid).toBe(true);
    expect(
      result.warnings.some(
        (w) =>
          w.code === "DARK_LIGHT_PARITY" &&
          w.message.includes("no colors-dark section exists")
      )
    ).toBe(true);
  });

  it("warns on key present in colors but missing from colors-dark", () => {
    const result = validate({
      name: "Parity Test",
      version: 1,
      colors: { primary: "#2563EB", accent: "#8B5CF6" },
      "colors-dark": { background: "#0a0a0a" },
    });
    expect(result.valid).toBe(true);
    expect(
      result.warnings.some(
        (w) =>
          w.code === "DARK_LIGHT_PARITY" &&
          w.message.includes('"accent"') &&
          w.message.includes("missing from colors-dark")
      )
    ).toBe(true);
  });

  it("no warning when only primary is set and no colors-dark", () => {
    const result = validate({
      name: "Parity Test",
      version: 1,
      colors: { primary: "#2563EB" },
    });
    expect(result.valid).toBe(true);
    expect(
      result.warnings.some((w) => w.code === "DARK_LIGHT_PARITY")
    ).toBe(false);
  });

  it("no warning when colors and colors-dark keys match", () => {
    const result = validate({
      name: "Parity Test",
      version: 1,
      colors: { primary: "#2563EB", accent: "#8B5CF6", background: "#FFFFFF" },
      "colors-dark": { accent: "#A78BFA", background: "#0a0a0a" },
    });
    expect(result.valid).toBe(true);
    expect(
      result.warnings.some((w) => w.code === "DARK_LIGHT_PARITY")
    ).toBe(false);
  });
});

// ============================================================
// Override Completeness (VI-420)
// ============================================================

describe("validate — override completeness (INCOMPLETE_OVERRIDE)", () => {
  it("D4-1: full override set produces no INCOMPLETE_OVERRIDE warnings", () => {
    // Surface trigger + every required token in every family present.
    const result = validate({
      name: "Full Overrides",
      version: 1,
      colors: { primary: "#666666", neutral: "#333333", background: "#000", surface: "#0a0a0a" },
      overrides: {
        light: {
          // text required: primary, secondary, tertiary, disabled
          "text-primary": "#fff",
          "text-secondary": "#ccc",
          "text-tertiary": "#aaa",
          "text-disabled": "#555",
          // surface required: 20 tokens
          "surface-page": "#0a0a0a",
          "surface-card": "#111",
          "surface-popover": "#141414",
          "surface-subtle": "#151515",
          "surface-muted": "#181818",
          "surface-interactive-default": "transparent",
          "surface-interactive-hover": "#202020",
          "surface-interactive-active": "#282828",
          "surface-interactive-disabled": "#151515",
          "surface-selected": "#303030",
          "surface-accent-subtle": "#1f1f1f",
          "surface-success-subtle": "#003814",
          "surface-warning-subtle": "#432600",
          "surface-error-subtle": "#4e0006",
          "surface-info-subtle": "#002e44",
          "surface-elev-0": "#101011",
          "surface-elev-1": "#181818",
          "surface-elev-2": "#212121",
          "surface-elev-3": "#282828",
          "surface-elev-4": "#303030",
          // border required: default, muted, strong, disabled
          "border-default": "#222",
          "border-muted": "#181818",
          "border-strong": "#333",
          "border-disabled": "#212121",
          // interactive required: secondary-{5}, ghost-{2}
          "interactive-secondary-bg": "#212121",
          "interactive-secondary-bg-hover": "#282828",
          "interactive-secondary-bg-active": "#303030",
          "interactive-secondary-text": "#fff",
          "interactive-secondary-border": "#303030",
          "interactive-ghost-bg": "#212121",
          "interactive-ghost-bg-hover": "#282828",
        },
      },
    });
    expect(result.warnings.filter((w) => w.code === "INCOMPLETE_OVERRIDE")).toHaveLength(0);
  });

  it("D4-2: partial overrides.light (only surface-page) warns for missing required tokens", () => {
    // surface-page override is the trigger; everything else missing = warned.
    const result = validate({
      name: "Partial Overrides",
      version: 1,
      colors: { primary: "#666666" },
      overrides: {
        light: { "surface-page": "#0a0a0a" },
      },
    });
    const warns = result.warnings.filter((w) => w.code === "INCOMPLETE_OVERRIDE");
    // Required minus surface-page = 4 text + 19 surface + 4 border + 7 interactive = 34
    expect(warns).toHaveLength(34);
    expect(warns.every((w) => w.path?.startsWith("overrides.light."))).toBe(true);
    expect(warns.some((w) => w.path === "overrides.light.surface-card")).toBe(true);
    expect(warns.some((w) => w.path === "overrides.light.text-primary")).toBe(true);
    expect(warns.some((w) => w.path === "overrides.light.border-default")).toBe(true);
    expect(warns.some((w) => w.path === "overrides.light.interactive-secondary-bg")).toBe(true);
  });

  it("D4-3: no overrides block produces no INCOMPLETE_OVERRIDE warnings", () => {
    const result = validate({
      name: "No Overrides",
      version: 1,
      colors: { primary: "#2563EB" },
    });
    expect(result.warnings.filter((w) => w.code === "INCOMPLETE_OVERRIDE")).toHaveLength(0);
  });

  it("D4-4: colors-dark shorthand only (no overrides) produces no warnings", () => {
    const result = validate({
      name: "Dark Shorthand",
      version: 1,
      colors: { primary: "#2563EB", background: "#ffffff" },
      "colors-dark": { background: "#000000", surface: "#0a0a0a" },
    });
    expect(result.warnings.filter((w) => w.code === "INCOMPLETE_OVERRIDE")).toHaveLength(0);
  });

  it("border-only overrides (no surface-page/card trigger) produce no warnings", () => {
    // Trigger requires surface-page or surface-card override (inverted-surface
    // signal). A pure border tweak isn't an inversion.
    const result = validate({
      name: "Border Tweak",
      version: 1,
      colors: { primary: "#2563EB" },
      overrides: {
        light: { "border-default": "#cccccc" },
      },
    });
    expect(result.warnings.filter((w) => w.code === "INCOMPLETE_OVERRIDE")).toHaveLength(0);
  });

  it("text-only stylistic tweak (no surface inversion) produces no warnings", () => {
    // Light-bg themes (modern-minimal, neutral, space) tweak text alphas
    // stylistically without inverting surfaces. The trigger must not fire on
    // these, or the validator spams real themes with false positives.
    const result = validate({
      name: "Text Tweak",
      version: 1,
      colors: { primary: "#2563EB" },
      overrides: {
        light: { "text-primary": "rgba(0, 0, 0, 0.9)" },
      },
    });
    expect(result.warnings.filter((w) => w.code === "INCOMPLETE_OVERRIDE")).toHaveLength(0);
  });

  it("surface-card alone triggers completeness check", () => {
    // surface-card override is an equally-strong inversion signal as surface-page.
    const result = validate({
      name: "Surface Card Only",
      version: 1,
      colors: { primary: "#2563EB" },
      overrides: {
        light: { "surface-card": "#0a0a0a" },
      },
    });
    const warns = result.warnings.filter((w) => w.code === "INCOMPLETE_OVERRIDE");
    expect(warns.length).toBeGreaterThan(0);
    expect(warns.every((w) => w.path?.startsWith("overrides.light."))).toBe(true);
  });

  it("dark-mode overrides are out of scope — no warnings even when incomplete", () => {
    // Engine dark defaults are already dark; symmetric "always-light leak" case
    // is intentionally deferred (not part of VI-420 / VI-417 class).
    const result = validate({
      name: "Dark Only Partial",
      version: 1,
      colors: { primary: "#2563EB" },
      overrides: {
        dark: { "surface-card": "#0d0d0d" },
      },
    });
    expect(result.warnings.filter((w) => w.code === "INCOMPLETE_OVERRIDE")).toHaveLength(0);
  });

  it("post-VI-417 Blackout (themes/blackout.visor.yaml) is clean", () => {
    // Loads the actual repo theme — guards against regressions in either the
    // validator or Blackout's coverage. If Blackout grows new gaps or the
    // required-token set drifts, this test fails loudly.
    const path = resolvePath(__dirname, "..", "..", "..", "..", "themes", "blackout.visor.yaml");
    const yaml = readFileSync(path, "utf-8");
    const config = parseConfig(yaml);
    const result = validate(config);
    const warns = result.warnings.filter((w) => w.code === "INCOMPLETE_OVERRIDE");
    expect(warns).toHaveLength(0);
  });

  it("pre-VI-417 Blackout fixture warns about the tokens VI-417 added", () => {
    // The reverse-baseline fixture proves the validator catches the exact
    // class of bug VI-417 fixed. Counts: surface (11 missing: selected,
    // accent-subtle, 4 status-subtle, 5 elev-*), border (1 missing: disabled),
    // interactive (7 missing: secondary-*, ghost-*). Total 19 in light mode.
    const path = resolvePath(__dirname, "fixtures", "blackout-pre-vi-417.visor.yaml");
    const yaml = readFileSync(path, "utf-8");
    const config = parseConfig(yaml);
    const result = validate(config);
    const lightWarns = result.warnings.filter(
      (w) => w.code === "INCOMPLETE_OVERRIDE" && w.path?.startsWith("overrides.light.")
    );
    expect(lightWarns).toHaveLength(19);
    // Spot-check the specific tokens VI-417 added
    const missingPaths = new Set(lightWarns.map((w) => w.path));
    expect(missingPaths.has("overrides.light.surface-selected")).toBe(true);
    expect(missingPaths.has("overrides.light.surface-accent-subtle")).toBe(true);
    expect(missingPaths.has("overrides.light.surface-success-subtle")).toBe(true);
    expect(missingPaths.has("overrides.light.surface-elev-0")).toBe(true);
    expect(missingPaths.has("overrides.light.surface-elev-4")).toBe(true);
    expect(missingPaths.has("overrides.light.border-disabled")).toBe(true);
    expect(missingPaths.has("overrides.light.interactive-secondary-bg")).toBe(true);
    expect(missingPaths.has("overrides.light.interactive-ghost-bg")).toBe(true);
  });
});
