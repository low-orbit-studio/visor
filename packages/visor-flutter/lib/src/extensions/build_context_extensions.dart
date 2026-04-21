import 'package:flutter/material.dart';

import 'visor_colors.dart';
import 'visor_motion.dart';
import 'visor_radius.dart';
import 'visor_shadows.dart';
import 'visor_spacing.dart';
import 'visor_text_styles.dart';

/// Convenience getters for reading Visor token ThemeExtensions off a
/// [BuildContext].
///
/// Any widget built inside a `MaterialApp` whose theme was produced by
/// `VisorTheme.build()` can read tokens directly:
///
/// ```dart
/// Container(
///   padding: EdgeInsets.all(context.visorSpacing.md),
///   decoration: BoxDecoration(
///     color: context.visorColors.surfaceCard,
///     borderRadius: BorderRadius.circular(context.visorRadius.md),
///   ),
///   child: Text('Hello', style: context.visorTextStyles.bodyMedium),
/// )
/// ```
///
/// Each getter asserts the corresponding [ThemeExtension] is attached to the
/// current [Theme]. `VisorTheme.build()` always attaches all six, so the
/// non-null assertion is safe for any consumer using the Visor builder.
extension VisorThemeContext on BuildContext {
  /// Semantic color tokens (text, surface, border, interactive).
  VisorColorsData get visorColors {
    final ext = Theme.of(this).extension<VisorColorsData>();
    assert(
      ext != null,
      'VisorColorsData is not attached to the current Theme. '
      'Make sure your MaterialApp uses VisorTheme.build().',
    );
    return ext!;
  }

  /// Material 3 text style slots (displayLarge … labelSmall, plus labelXSmall).
  VisorTextStylesData get visorTextStyles {
    final ext = Theme.of(this).extension<VisorTextStylesData>();
    assert(
      ext != null,
      'VisorTextStylesData is not attached to the current Theme. '
      'Make sure your MaterialApp uses VisorTheme.build().',
    );
    return ext!;
  }

  /// Spacing scale (xs, sm, md, lg, xl, xxl, xxxl).
  VisorSpacingData get visorSpacing {
    final ext = Theme.of(this).extension<VisorSpacingData>();
    assert(
      ext != null,
      'VisorSpacingData is not attached to the current Theme. '
      'Make sure your MaterialApp uses VisorTheme.build().',
    );
    return ext!;
  }

  /// Border radius scale (sm, md, lg, xl, pill).
  VisorRadiusData get visorRadius {
    final ext = Theme.of(this).extension<VisorRadiusData>();
    assert(
      ext != null,
      'VisorRadiusData is not attached to the current Theme. '
      'Make sure your MaterialApp uses VisorTheme.build().',
    );
    return ext!;
  }

  /// Box shadow lists (xs, sm, md, lg, xl).
  VisorShadowsData get visorShadows {
    final ext = Theme.of(this).extension<VisorShadowsData>();
    assert(
      ext != null,
      'VisorShadowsData is not attached to the current Theme. '
      'Make sure your MaterialApp uses VisorTheme.build().',
    );
    return ext!;
  }

  /// Motion tokens (durations + easing curves).
  VisorMotionData get visorMotion {
    final ext = Theme.of(this).extension<VisorMotionData>();
    assert(
      ext != null,
      'VisorMotionData is not attached to the current Theme. '
      'Make sure your MaterialApp uses VisorTheme.build().',
    );
    return ext!;
  }
}
