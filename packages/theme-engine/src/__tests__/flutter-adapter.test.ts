import { describe, it, expect, vi } from "vitest";
import { flutterAdapter } from "../adapters/flutter.js";
import { generateThemeData } from "../pipeline.js";
import {
  cssColorToDart,
  cssColorToOpaqueDart,
  opacityVariants,
  alphaToByte,
} from "../flutter/color-to-dart.js";
import { emitSpacingDart } from "../flutter/emit-spacing.js";
import { emitRadiusDart } from "../flutter/emit-radius.js";
import { emitTypographyDart } from "../flutter/emit-typography.js";
import {
  emitShadowsDart,
  parseShadowListToDart,
} from "../flutter/emit-shadows.js";
import { emitStrokesDart } from "../flutter/emit-strokes.js";
import {
  emitMotionDart,
  parseDurationToDart,
  parseEasingToDart,
} from "../flutter/emit-motion.js";

const MINIMAL_YAML = `
name: Test Theme
version: 1
colors:
  primary: "#2563EB"
`.trim();

describe("color-to-dart", () => {
  describe("cssColorToDart", () => {
    it("converts hex to Dart Color with full alpha by default", () => {
      expect(cssColorToDart("#2563EB")).toBe("Color(0xFF2563EB)");
    });

    it("respects explicit alpha override", () => {
      expect(cssColorToDart("#2563EB", 0.5)).toBe("Color(0x802563EB)");
    });

    it("respects alpha from rgba", () => {
      expect(cssColorToDart("rgba(37, 99, 235, 0.5)")).toBe(
        "Color(0x802563EB)",
      );
    });

    it("handles lowercase hex", () => {
      expect(cssColorToDart("#abc")).toBe("Color(0xFFAABBCC)");
    });

    it("throws on invalid CSS color", () => {
      expect(() => cssColorToDart("nope")).toThrow();
    });
  });

  describe("cssColorToOpaqueDart", () => {
    it("always returns full-alpha form", () => {
      expect(cssColorToOpaqueDart("rgba(255, 0, 0, 0.1)")).toBe(
        "Color(0xFFFF0000)",
      );
    });
  });

  describe("opacityVariants", () => {
    it("emits default 7-step opacity scale", () => {
      const variants = opacityVariants("#2563EB");
      expect(Object.keys(variants)).toEqual([
        "5o",
        "10o",
        "20o",
        "40o",
        "50o",
        "60o",
        "80o",
      ]);
      expect(variants["50o"]).toBe("Color(0x802563EB)");
    });
  });

  describe("alphaToByte", () => {
    it("rounds to nearest byte", () => {
      expect(alphaToByte(0)).toBe(0);
      expect(alphaToByte(0.5)).toBe(128);
      expect(alphaToByte(1)).toBe(255);
    });

    it("clamps out-of-range values", () => {
      expect(alphaToByte(-0.5)).toBe(0);
      expect(alphaToByte(2)).toBe(255);
    });
  });
});

describe("flutterAdapter", () => {
  const data = generateThemeData(MINIMAL_YAML);
  const adapterInput = {
    primitives: data.primitives,
    tokens: data.tokens,
    config: data.config,
  };

  it("returns a file map with a file per token category plus the scaffold", () => {
    const result = flutterAdapter(adapterInput);
    expect(result.files).toHaveProperty("pubspec.yaml");
    expect(result.files).toHaveProperty("lib/ui.dart");
    expect(result.files).toHaveProperty("lib/src/colors/visor_colors.dart");
    expect(result.files).toHaveProperty(
      "lib/src/typography/visor_text_styles.dart",
    );
    expect(result.files).toHaveProperty("lib/src/spacing/visor_spacing.dart");
    expect(result.files).toHaveProperty("lib/src/radius/visor_radius.dart");
    expect(result.files).toHaveProperty("lib/src/shadows/visor_shadows.dart");
    expect(result.files).toHaveProperty(
      "lib/src/strokes/visor_stroke_widths.dart",
    );
    expect(result.files).toHaveProperty("lib/src/motion/visor_motion.dart");
    expect(result.files).toHaveProperty("lib/src/theme/visor_theme.dart");
  });

  it("visor_colors.dart imports visor_core and declares VisorColors wrapper", () => {
    const { files } = flutterAdapter(adapterInput);
    const colors = files["lib/src/colors/visor_colors.dart"];
    expect(colors).toContain("import 'package:visor_core/visor_core.dart';");
    expect(colors).toContain("sealed class VisorColors");
    expect(colors).toContain("static const Color primary500 =");
    expect(colors).toContain("static const Color neutral50 =");
  });

  it("emits VisorColorsData light and dark instances", () => {
    const { files } = flutterAdapter(adapterInput);
    const colors = files["lib/src/colors/visor_colors.dart"];
    expect(colors).toContain(
      "static final VisorColorsData light = VisorColorsData(",
    );
    expect(colors).toContain(
      "static final VisorColorsData dark = VisorColorsData(",
    );
    expect(colors).toContain("textPrimary:");
    expect(colors).toContain("surfacePage:");
    expect(colors).toContain("interactivePrimaryBg:");
  });

  it("emits opacity variants for primary/accent anchors", () => {
    const { files } = flutterAdapter(adapterInput);
    const colors = files["lib/src/colors/visor_colors.dart"];
    expect(colors).toContain("primary500_50o");
    expect(colors).toContain("white_10o");
    expect(colors).toContain("black_40o");
  });

  it("visor_theme.dart wires every token instance into VisorTheme.build", () => {
    const { files } = flutterAdapter(adapterInput);
    const theme = files["lib/src/theme/visor_theme.dart"];
    expect(theme).toContain("import 'package:visor_core/visor_core.dart';");
    expect(theme).toContain("import '../colors/visor_colors.dart';");
    expect(theme).toContain("import '../typography/visor_text_styles.dart';");
    expect(theme).toContain("import '../spacing/visor_spacing.dart';");
    expect(theme).toContain("import '../radius/visor_radius.dart';");
    expect(theme).toContain("import '../shadows/visor_shadows.dart';");
    expect(theme).toContain(
      "import '../strokes/visor_stroke_widths.dart';",
    );
    expect(theme).toContain("import '../motion/visor_motion.dart';");
    expect(theme).toContain("sealed class VisorAppTheme");
    expect(theme).toContain("VisorTheme.build(");
    expect(theme).toContain("colors: VisorColors.light");
    expect(theme).toContain("colors: VisorColors.dark");
    expect(theme).toContain("textStyles: VisorTextStyles.instance");
    expect(theme).toContain("spacing: VisorSpacing.instance");
    expect(theme).toContain("radius: VisorRadius.instance");
    expect(theme).toContain("shadows: VisorShadows.instance");
    expect(theme).toContain("strokeWidths: VisorStrokeWidths.instance");
    expect(theme).toContain("motion: VisorMotion.instance");
  });

  it("pubspec.yaml declares visor_core dependency", () => {
    const { files } = flutterAdapter(adapterInput);
    const pubspec = files["pubspec.yaml"];
    expect(pubspec).toContain("name: ui");
    expect(pubspec).toContain("visor_core:");
    expect(pubspec).toContain("publish_to: none");
  });

  it("honors packageName option", () => {
    const { files } = flutterAdapter(adapterInput, { packageName: "solespark_ui" });
    expect(files["pubspec.yaml"]).toContain("name: solespark_ui");
  });

  it("skips scaffolding but still emits all token files with tokensOnly=true", () => {
    const { files } = flutterAdapter(adapterInput, { tokensOnly: true });
    expect(files).toHaveProperty("lib/src/colors/visor_colors.dart");
    expect(files).toHaveProperty("lib/src/typography/visor_text_styles.dart");
    expect(files).toHaveProperty("lib/src/spacing/visor_spacing.dart");
    expect(files).toHaveProperty("lib/src/radius/visor_radius.dart");
    expect(files).toHaveProperty("lib/src/shadows/visor_shadows.dart");
    expect(files).toHaveProperty(
      "lib/src/strokes/visor_stroke_widths.dart",
    );
    expect(files).toHaveProperty("lib/src/motion/visor_motion.dart");
    expect(files).not.toHaveProperty("pubspec.yaml");
    expect(files).not.toHaveProperty("lib/ui.dart");
    expect(files).not.toHaveProperty("lib/src/theme/visor_theme.dart");
  });

  it("emits only light getter when lightOnly=true", () => {
    const { files } = flutterAdapter(adapterInput, { lightOnly: true });
    const theme = files["lib/src/theme/visor_theme.dart"];
    expect(theme).toContain("static ThemeData get light");
    expect(theme).not.toContain("static ThemeData get dark");
  });

  it("honors custom themeClassName", () => {
    const { files } = flutterAdapter(adapterInput, { themeClassName: "AppTheme" });
    expect(files["lib/src/theme/visor_theme.dart"]).toContain("sealed class AppTheme");
  });

  it("produces valid Dart colors with 0x prefix and 8 hex digits", () => {
    const { files } = flutterAdapter(adapterInput);
    const colors = files["lib/src/colors/visor_colors.dart"];
    // Every Color() literal should be 0x + 8 hex digits
    const colorLiterals = [...colors.matchAll(/Color\((0x[0-9A-F]+)\)/g)];
    expect(colorLiterals.length).toBeGreaterThan(50);
    for (const [, literal] of colorLiterals) {
      expect(literal).toMatch(/^0x[0-9A-F]{8}$/);
    }
  });
});

// ============================================================
// Token emitters (typography / spacing / radius)
// ============================================================

const FULL_YAML = `
name: Full Token Test
version: 1
colors:
  primary: "#2563EB"
typography:
  heading: { family: Inter, weight: 600 }
  body: { family: Inter, weight: 400 }
  slots:
    displayLarge:
      size: 56
      weight: 500
      letter-spacing: -0.5
    titleMedium:
      weight: 600
    bodyLarge:
      letter-spacing: 0.15
spacing:
  base: 4
radius:
  sm: 4
  md: 8
  lg: 12
  xl: 16
  pill: 9999
`.trim();

function fullAdapterInput() {
  const data = generateThemeData(FULL_YAML);
  return {
    primitives: data.primitives,
    tokens: data.tokens,
    config: data.config,
  };
}

describe("emitSpacingDart", () => {
  it("derives the 7-step scale from config.spacing.base", () => {
    const dart = emitSpacingDart(fullAdapterInput());
    expect(dart).toContain("sealed class VisorSpacing");
    expect(dart).toContain("static final VisorSpacingData instance =");
    // Base 4 → xs=4, sm=8, md=12, lg=16, xl=24, xxl=32, xxxl=48
    expect(dart).toContain("xs: 4,");
    expect(dart).toContain("sm: 8,");
    expect(dart).toContain("md: 12,");
    expect(dart).toContain("lg: 16,");
    expect(dart).toContain("xl: 24,");
    expect(dart).toContain("xxl: 32,");
    expect(dart).toContain("xxxl: 48,");
  });

  it("scales proportionally when base changes", () => {
    const data = generateThemeData(
      `name: Big\nversion: 1\ncolors:\n  primary: "#000"\nspacing:\n  base: 8`,
    );
    const dart = emitSpacingDart({
      primitives: data.primitives,
      tokens: data.tokens,
      config: data.config,
    });
    expect(dart).toContain("xs: 8,");
    expect(dart).toContain("md: 24,");
    expect(dart).toContain("xxxl: 96,");
  });
});

describe("emitRadiusDart", () => {
  it("emits identity mapping from config.radius", () => {
    const dart = emitRadiusDart(fullAdapterInput());
    expect(dart).toContain("sealed class VisorRadius");
    expect(dart).toContain("static final VisorRadiusData instance =");
    expect(dart).toContain("sm: 4,");
    expect(dart).toContain("md: 8,");
    expect(dart).toContain("lg: 12,");
    expect(dart).toContain("xl: 16,");
    expect(dart).toContain("pill: 9999,");
  });
});

describe("emitTypographyDart", () => {
  it("returns defaults-only when no slot overrides are supplied", () => {
    const data = generateThemeData(
      `name: Minimal\nversion: 1\ncolors:\n  primary: "#000"`,
    );
    const dart = emitTypographyDart({
      primitives: data.primitives,
      tokens: data.tokens,
      config: data.config,
    });
    expect(dart).toContain("sealed class VisorTextStyles");
    expect(dart).toContain(
      "static final VisorTextStylesData instance =",
    );
    expect(dart).toContain("VisorTextStylesData.defaults");
    expect(dart).not.toContain("copyWith(");
  });

  it("emits copyWith with merged slot overrides", () => {
    const dart = emitTypographyDart(fullAdapterInput());
    expect(dart).toContain("VisorTextStylesData.defaults.copyWith(");
    // displayLarge: user overrides all three fields
    expect(dart).toContain("displayLarge: const TextStyle(");
    expect(dart).toContain("fontSize: 56,");
    expect(dart).toContain("fontWeight: FontWeight.w500,");
    expect(dart).toContain("letterSpacing: -0.5,");
    // titleMedium: only weight overridden — size + letterSpacing inherit from defaults
    expect(dart).toContain("titleMedium: const TextStyle(");
    expect(dart).toContain("fontSize: 16,"); // default
    expect(dart).toContain("fontWeight: FontWeight.w600,"); // override
    expect(dart).toContain("letterSpacing: 0.15,"); // default for titleMedium
    // bodyLarge: only letter-spacing overridden (0.15 happens to equal titleMedium default)
    expect(dart).toContain("bodyLarge: const TextStyle(");
  });

  it("omits letterSpacing when neither user nor Material 3 defines one", () => {
    const data = generateThemeData(
      `name: Omit\nversion: 1\ncolors:\n  primary: "#000"\ntypography:\n  slots:\n    displayMedium: { size: 40 }`,
    );
    const dart = emitTypographyDart({
      primitives: data.primitives,
      tokens: data.tokens,
      config: data.config,
    });
    // displayMedium has no default letterSpacing; user didn't set one — omit the field
    const displayMediumBlock = dart.match(
      /displayMedium: const TextStyle\([\s\S]*?\),/,
    )![0];
    expect(displayMediumBlock).not.toContain("letterSpacing");
    expect(displayMediumBlock).toContain("fontSize: 40,");
  });
});

describe("emitShadowsDart / parseShadowListToDart", () => {
  it("parses single x/y/blur/color shadows", () => {
    const dart = parseShadowListToDart("0 4px 12px rgba(0, 0, 0, 0.1)");
    expect(dart).toContain("BoxShadow(");
    expect(dart).toContain("offset: Offset(0, 4)");
    expect(dart).toContain("blurRadius: 12");
    expect(dart).toContain("color: Color(0x1A000000)");
    // No spread → spreadRadius omitted
    expect(dart).not.toContain("spreadRadius");
  });

  it("handles x/y offsets with and without 'px'", () => {
    const dart = parseShadowListToDart("-2px 3 4 0 rgba(0,0,0,0.5)");
    expect(dart).toContain("offset: Offset(-2, 3)");
    expect(dart).toContain("blurRadius: 4");
    // spread=0 → omitted
    expect(dart).not.toContain("spreadRadius");
  });

  it("emits spreadRadius when non-zero", () => {
    const dart = parseShadowListToDart("0 2px 6px 2px rgba(0,0,0,0.1)");
    expect(dart).toContain("spreadRadius: 2");
  });

  it("splits multi-layer shadows at top-level commas", () => {
    const dart = parseShadowListToDart(
      "0 1px 2px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.1)",
    );
    const shadows = dart.match(/BoxShadow\(/g)!;
    expect(shadows.length).toBe(2);
    expect(dart).toContain("Color(0x0D000000)"); // 5% black
    expect(dart).toContain("Color(0x1A000000)"); // 10% black
  });

  it("keeps commas inside rgba() from splitting the list", () => {
    const dart = parseShadowListToDart("0 1px 3px rgba(0, 0, 0, 0.04)");
    const shadows = dart.match(/BoxShadow\(/g)!;
    expect(shadows.length).toBe(1);
  });

  it("accepts hex color", () => {
    const dart = parseShadowListToDart("0 0 4px #00000080");
    expect(dart).toContain("color: Color(0x80000000)");
  });

  it("rejects 'inset' shadows", () => {
    expect(() =>
      parseShadowListToDart("inset 0 0 4px rgba(0,0,0,0.5)"),
    ).toThrow(/inset/);
  });

  it("rejects shadows missing a color", () => {
    expect(() => parseShadowListToDart("0 4px 12px")).toThrow(
      /missing trailing color/,
    );
  });

  it("emitShadowsDart wires all 5 token keys", () => {
    const data = generateThemeData(FULL_YAML);
    const dart = emitShadowsDart({
      primitives: data.primitives,
      tokens: data.tokens,
      config: data.config,
    });
    expect(dart).toContain("sealed class VisorShadows");
    expect(dart).toContain("static final VisorShadowsData instance =");
    for (const key of ["xs:", "sm:", "md:", "lg:", "xl:"]) {
      expect(dart).toContain(key);
    }
  });
});

describe("emitStrokesDart", () => {
  it("wires all 4 stroke-width slots with default values", () => {
    const data = generateThemeData(MINIMAL_YAML);
    const dart = emitStrokesDart({
      primitives: data.primitives,
      tokens: data.tokens,
      config: data.config,
    });
    expect(dart).toContain("sealed class VisorStrokeWidths");
    expect(dart).toContain("static final VisorStrokeWidthsData instance =");
    expect(dart).toContain("thin: 1,");
    expect(dart).toContain("regular: 1.5,");
    expect(dart).toContain("medium: 2,");
    expect(dart).toContain("thick: 2.5,");
  });

  it("respects strokeWidths overrides from .visor.yaml", () => {
    const yaml = `
name: Stroke Override
version: 1
colors:
  primary: "#2563EB"
strokeWidths:
  thin: 0.5
  thick: 4
`.trim();
    const data = generateThemeData(yaml);
    const dart = emitStrokesDart({
      primitives: data.primitives,
      tokens: data.tokens,
      config: data.config,
    });
    expect(dart).toContain("thin: 0.5,");
    expect(dart).toContain("regular: 1.5,"); // default kept
    expect(dart).toContain("thick: 4,");
  });
});

describe("emitMotionDart / duration + easing parsers", () => {
  describe("parseDurationToDart", () => {
    it("parses ms", () => {
      expect(parseDurationToDart("200ms")).toBe(
        "Duration(milliseconds: 200)",
      );
    });
    it("parses fractional seconds", () => {
      expect(parseDurationToDart("0.4s")).toBe(
        "Duration(milliseconds: 400)",
      );
    });
    it("rounds fractional ms", () => {
      expect(parseDurationToDart("166.7ms")).toBe(
        "Duration(milliseconds: 167)",
      );
    });
    it("rejects unitless values", () => {
      expect(() => parseDurationToDart("200")).toThrow();
    });
    it("rejects negative", () => {
      expect(() => parseDurationToDart("-100ms")).toThrow();
    });
  });

  describe("parseEasingToDart", () => {
    it("maps CSS keywords to Curves.*", () => {
      expect(parseEasingToDart("linear")).toBe("Curves.linear");
      expect(parseEasingToDart("ease-in-out")).toBe("Curves.easeInOut");
      expect(parseEasingToDart("ease-in")).toBe("Curves.easeIn");
    });
    it("parses cubic-bezier arguments", () => {
      expect(parseEasingToDart("cubic-bezier(0.4, 0, 0.2, 1)")).toBe(
        "Cubic(0.4, 0, 0.2, 1)",
      );
    });
    it("accepts negative args (anticipate/overshoot curves)", () => {
      expect(parseEasingToDart("cubic-bezier(0.68, -0.55, 0.27, 1.55)")).toBe(
        "Cubic(0.68, -0.55, 0.27, 1.55)",
      );
    });
    it("falls back to Curves.easeInOut on unknown input", () => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
      expect(parseEasingToDart("bouncy")).toBe("Curves.easeInOut");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  it("emitMotionDart wires all four motion fields", () => {
    const data = generateThemeData(FULL_YAML);
    const dart = emitMotionDart({
      primitives: data.primitives,
      tokens: data.tokens,
      config: data.config,
    });
    expect(dart).toContain("sealed class VisorMotion");
    expect(dart).toContain("static final VisorMotionData instance =");
    expect(dart).toContain("durationFast: Duration(");
    expect(dart).toContain("durationNormal: Duration(");
    expect(dart).toContain("durationSlow: Duration(");
    expect(dart).toContain("easing: Cubic(0.4, 0, 0.2, 1)");
  });
});
