/**
 * Flutter Adapter
 *
 * Generates a Dart package (or token-only file set) from Visor theme data,
 * matching the Low Orbit canonical `packages/ui/` structure:
 *
 * ```
 * packages/ui/
 * ├── pubspec.yaml
 * ├── lib/
 * │   ├── ui.dart                             # barrel
 * │   └── src/
 * │       ├── colors/visor_colors.dart        # primitives + VisorColors.light/dark
 * │       ├── typography/visor_text_styles.dart
 * │       ├── spacing/visor_spacing.dart
 * │       ├── radius/visor_radius.dart
 * │       ├── shadows/visor_shadows.dart
 * │       ├── strokes/visor_stroke_widths.dart
 * │       ├── motion/visor_motion.dart
 * │       └── theme/visor_theme.dart          # VisorAppTheme.{light,dark}
 * ```
 */

import type {
  AdapterFileMap,
  AdapterInput,
  FlutterAdapterOptions,
} from "./types.js";
import { emitColorsDart } from "../flutter/emit-colors.js";
import { emitTypographyDart } from "../flutter/emit-typography.js";
import { emitSpacingDart } from "../flutter/emit-spacing.js";
import { emitRadiusDart } from "../flutter/emit-radius.js";
import { emitShadowsDart } from "../flutter/emit-shadows.js";
import { emitStrokesDart } from "../flutter/emit-strokes.js";
import { emitMotionDart } from "../flutter/emit-motion.js";
import { emitThemeDart } from "../flutter/emit-theme.js";

/**
 * Generate a Flutter token package from theme engine output.
 *
 * @returns File map keyed by path relative to the output directory.
 */
export function flutterAdapter(
  input: AdapterInput,
  options?: FlutterAdapterOptions,
): AdapterFileMap {
  const packageName = options?.packageName ?? "ui";
  const themeClassName = options?.themeClassName ?? "VisorAppTheme";
  const visorCoreVersion = options?.visorCoreVersion ?? "^0.1.0";
  const tokensOnly = options?.tokensOnly ?? false;
  const lightOnly = options?.lightOnly ?? false;
  const darkOnly = options?.darkOnly ?? false;

  const files: Record<string, string> = {};

  // Token files (always emitted — consumer always owns these).
  files["lib/src/colors/visor_colors.dart"] = emitColorsDart(input);
  files["lib/src/typography/visor_text_styles.dart"] = emitTypographyDart(input);
  files["lib/src/spacing/visor_spacing.dart"] = emitSpacingDart(input);
  files["lib/src/radius/visor_radius.dart"] = emitRadiusDart(input);
  files["lib/src/shadows/visor_shadows.dart"] = emitShadowsDart(input);
  files["lib/src/strokes/visor_stroke_widths.dart"] = emitStrokesDart(input);
  files["lib/src/motion/visor_motion.dart"] = emitMotionDart(input);

  // Skip the package scaffolding (pubspec, barrel, theme wrapper) when
  // `--tokens-only` — useful for slot-in into an existing consumer package.
  if (!tokensOnly) {
    files["pubspec.yaml"] = emitPubspec(packageName, visorCoreVersion);
    files["lib/ui.dart"] = emitBarrel();
    files["lib/src/theme/visor_theme.dart"] = emitThemeDart({
      themeClassName,
      emitLight: !darkOnly,
      emitDark: !lightOnly,
      tokenImports: [
        "../colors/visor_colors.dart",
        "../typography/visor_text_styles.dart",
        "../spacing/visor_spacing.dart",
        "../radius/visor_radius.dart",
        "../shadows/visor_shadows.dart",
        "../strokes/visor_stroke_widths.dart",
        "../motion/visor_motion.dart",
      ],
    });
  }

  return { files };
}

function emitPubspec(packageName: string, visorCoreVersion: string): string {
  return [
    `name: ${packageName}`,
    `description: Generated Visor tokens for this project. Regenerate with \`visor theme apply\`.`,
    `version: 0.1.0+1`,
    `publish_to: none`,
    ``,
    `environment:`,
    `  sdk: ^3.5.0`,
    `  flutter: ^3.24.0`,
    ``,
    `dependencies:`,
    `  flutter:`,
    `    sdk: flutter`,
    `  visor_core: ${visorCoreVersion}`,
    ``,
    `dev_dependencies:`,
    `  flutter_test:`,
    `    sdk: flutter`,
    ``,
    `flutter:`,
    `  uses-material-design: true`,
    ``,
  ].join("\n");
}

function emitBarrel(): string {
  return [
    `/// Generated barrel for the Visor tokens package.`,
    `library;`,
    ``,
    `export 'src/colors/visor_colors.dart';`,
    `export 'src/typography/visor_text_styles.dart';`,
    `export 'src/spacing/visor_spacing.dart';`,
    `export 'src/radius/visor_radius.dart';`,
    `export 'src/shadows/visor_shadows.dart';`,
    `export 'src/strokes/visor_stroke_widths.dart';`,
    `export 'src/motion/visor_motion.dart';`,
    `export 'src/theme/visor_theme.dart';`,
    ``,
    `// Re-export visor_core so consumers can access ThemeExtensions with a`,
    `// single import of this package.`,
    `export 'package:visor_core/visor_core.dart';`,
    ``,
  ].join("\n");
}
