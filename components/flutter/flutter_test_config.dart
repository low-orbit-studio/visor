import 'dart:async';

import 'package:alchemist/alchemist.dart';

/// Project-wide alchemist configuration for `components/flutter/`.
///
/// Activated automatically by `flutter test` — Flutter discovers this file
/// because it sits at the package root, above every `<widget>_test.dart`.
///
/// **Only CI goldens are produced.** CI goldens render with the Ahem font
/// (every glyph a solid square), producing byte-identical output across
/// hosts. Output lands in `<widget>/goldens/ci/*.png` and is the canonical
/// baseline that PRs verify against. Platform goldens are disabled because
/// their host-dependent output causes Linux/macOS divergence — Widgetbook
/// is the canonical place for human-eyes visual review.
Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  return AlchemistConfig.runWithConfig(
    config: const AlchemistConfig(
      platformGoldensConfig: PlatformGoldensConfig(enabled: false),
      ciGoldensConfig: CiGoldensConfig(),
    ),
    run: testMain,
  );
}
