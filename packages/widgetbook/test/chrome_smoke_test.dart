import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_themes/visor_themes.dart';
import 'package:visor_widgetbook/chrome/visor_chrome.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('chrome theme', () {
    test('chrome theme bakes Satoshi into bodyMedium', () {
      final theme = buildChromeTheme();
      expect(theme.textTheme.bodyMedium?.fontFamily, 'Satoshi');
    });

    test('chrome theme is built from Blackout dark', () {
      final theme = buildChromeTheme();
      final blackoutDark = VisorThemes.blackout.dark;
      expect(theme.colorScheme.primary,
          equals(blackoutDark.colorScheme.primary));
      expect(theme.colorScheme.surface,
          equals(blackoutDark.colorScheme.surface));
    });

    test('preview theme inherits Satoshi from arbitrary input theme', () {
      for (final pair in <(String, VisorThemePair)>[
        ('blackout', VisorThemes.blackout),
        ('veronica', VisorThemes.veronica),
        ('solespark', VisorThemes.solespark),
      ]) {
        final preview = buildPreviewTheme(pair.$2.light);
        expect(preview.textTheme.bodyMedium?.fontFamily, 'Satoshi',
            reason: '${pair.$1} light preview must apply Satoshi');
      }
    });
  });

  group('backdrop resolution', () {
    testWidgets(
        'resolveBackdrop returns VisorColorsData.surfacePage from active theme',
        (tester) async {
      final theme = buildPreviewTheme(VisorThemes.blackout.light);
      final expected = VisorThemes.blackout.light
          .extension<VisorColorsData>()!
          .surfacePage;

      Color? captured;
      await tester.pumpWidget(MaterialApp(
        theme: theme,
        home: Builder(
          builder: (context) {
            captured = resolveBackdrop(context);
            return const SizedBox.shrink();
          },
        ),
      ));

      expect(captured, equals(expected));
    });

    testWidgets('Scaffold backdrop tracks the active theme — Blackout Light',
        (tester) async {
      final preview = buildPreviewTheme(VisorThemes.blackout.light);
      final expected = VisorThemes.blackout.light
          .extension<VisorColorsData>()!
          .surfacePage;

      await tester.pumpWidget(MaterialApp(
        theme: preview,
        home: Builder(
          builder: (ctx) => Scaffold(
            backgroundColor: resolveBackdrop(ctx),
            body: const SizedBox.expand(),
          ),
        ),
      ));

      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold));
      expect(scaffold.backgroundColor, equals(expected));
    });
  });
}
