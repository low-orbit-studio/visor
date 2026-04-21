import { describe, it, expect } from "vitest";
import { flutterAdapter } from "../adapters/flutter.js";
import { generateThemeData } from "../pipeline.js";
import {
  cssColorToDart,
  cssColorToOpaqueDart,
  opacityVariants,
  alphaToByte,
} from "../flutter/color-to-dart.js";

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

  it("returns a file map with expected entries", () => {
    const result = flutterAdapter(adapterInput);
    expect(result.files).toHaveProperty("pubspec.yaml");
    expect(result.files).toHaveProperty("lib/ui.dart");
    expect(result.files).toHaveProperty("lib/src/colors/ui_colors.dart");
    expect(result.files).toHaveProperty("lib/src/theme/ui_theme.dart");
  });

  it("ui_colors.dart imports visor_core and declares UIColors", () => {
    const { files } = flutterAdapter(adapterInput);
    const colors = files["lib/src/colors/ui_colors.dart"];
    expect(colors).toContain("import 'package:visor_core/visor_core.dart';");
    expect(colors).toContain("sealed class UIColors");
    expect(colors).toContain("static const Color primary500 =");
    expect(colors).toContain("static const Color neutral50 =");
  });

  it("emits VisorColors.light and VisorColors.dark instances", () => {
    const { files } = flutterAdapter(adapterInput);
    const colors = files["lib/src/colors/ui_colors.dart"];
    expect(colors).toContain("static final VisorColors light = VisorColors(");
    expect(colors).toContain("static final VisorColors dark = VisorColors(");
    expect(colors).toContain("textPrimary:");
    expect(colors).toContain("surfacePage:");
    expect(colors).toContain("interactivePrimaryBg:");
  });

  it("emits opacity variants for primary/accent anchors", () => {
    const { files } = flutterAdapter(adapterInput);
    const colors = files["lib/src/colors/ui_colors.dart"];
    expect(colors).toContain("primary500_50o");
    expect(colors).toContain("white_10o");
    expect(colors).toContain("black_40o");
  });

  it("ui_theme.dart wires Visor builder correctly", () => {
    const { files } = flutterAdapter(adapterInput);
    const theme = files["lib/src/theme/ui_theme.dart"];
    expect(theme).toContain("import 'package:visor_core/visor_core.dart';");
    expect(theme).toContain("sealed class VisorAppTheme");
    expect(theme).toContain("VisorTheme.build(");
    expect(theme).toContain("colors: UIColors.light");
    expect(theme).toContain("colors: UIColors.dark");
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

  it("skips scaffolding with tokensOnly=true", () => {
    const { files } = flutterAdapter(adapterInput, { tokensOnly: true });
    expect(files).toHaveProperty("lib/src/colors/ui_colors.dart");
    expect(files).not.toHaveProperty("pubspec.yaml");
    expect(files).not.toHaveProperty("lib/src/theme/ui_theme.dart");
  });

  it("emits only light getter when lightOnly=true", () => {
    const { files } = flutterAdapter(adapterInput, { lightOnly: true });
    const theme = files["lib/src/theme/ui_theme.dart"];
    expect(theme).toContain("static ThemeData get light");
    expect(theme).not.toContain("static ThemeData get dark");
  });

  it("honors custom themeClassName", () => {
    const { files } = flutterAdapter(adapterInput, { themeClassName: "AppTheme" });
    expect(files["lib/src/theme/ui_theme.dart"]).toContain("sealed class AppTheme");
  });

  it("produces valid Dart colors (all have 0x prefix and correct length)", () => {
    const { files } = flutterAdapter(adapterInput);
    const colors = files["lib/src/colors/ui_colors.dart"];
    // Every Color() literal should be 0x + 8 hex digits
    const colorLiterals = [...colors.matchAll(/Color\((0x[0-9A-F]+)\)/g)];
    expect(colorLiterals.length).toBeGreaterThan(50);
    for (const [, literal] of colorLiterals) {
      expect(literal).toMatch(/^0x[0-9A-F]{8}$/);
    }
  });
});
