import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:visor_themes/visor_themes.dart';
import 'package:visor_widgetbook/main.dart';
import 'package:visor_widgetbook/theme/widgetbook_theme.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues(<String, Object>{});
  });

  group('VisorWidgetbookApp boot', () {
    testWidgets('boots with the persisted theme + brightness', (tester) async {
      SharedPreferences.setMockInitialValues(<String, Object>{
        kVisorWidgetbookThemePrefsKey: 'Custom / Veronica',
        kVisorWidgetbookBrightnessPrefsKey: 'light',
      });
      final prefs = await SharedPreferences.getInstance();

      await tester.pumpWidget(VisorWidgetbookApp(
        prefs: prefs,
        initialThemeLabel: 'Custom / Veronica',
        initialBrightness: ThemeMode.light,
      ));
      await tester.pumpAndSettle();

      // Wordmark renders — chrome is alive.
      expect(find.text('Visor.'), findsWidgets);
    });

    testWidgets('boots with default theme when persisted label is unknown',
        (tester) async {
      final prefs = await SharedPreferences.getInstance();

      await tester.pumpWidget(VisorWidgetbookApp(
        prefs: prefs,
        initialThemeLabel: 'Nope / Missing',
        initialBrightness: ThemeMode.dark,
      ));
      await tester.pumpAndSettle();

      expect(find.text('Visor.'), findsWidgets);
    });
  });

  group('VisorPreviewShell backdrop', () {
    testWidgets('backdrop matches active theme surfacePage', (tester) async {
      final theme = VisorThemes.blackout.dark;
      final expected =
          theme.extension<VisorColorsData>()!.surfacePage;

      await tester.pumpWidget(MaterialApp(
        theme: theme,
        home: const VisorPreviewShell(child: SizedBox.expand()),
      ));

      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold));
      expect(scaffold.backgroundColor, equals(expected));
    });

    testWidgets('backdrop tracks theme change', (tester) async {
      ThemeData current = VisorThemes.blackout.dark;
      late StateSetter rebuild;

      await tester.pumpWidget(StatefulBuilder(
        builder: (ctx, setState) {
          rebuild = setState;
          return MaterialApp(
            theme: current,
            home: const VisorPreviewShell(child: SizedBox.expand()),
          );
        },
      ));

      Color? bg() =>
          tester.widget<Scaffold>(find.byType(Scaffold)).backgroundColor;

      final blackoutBg = bg();

      rebuild(() => current = VisorThemes.solespark.light);
      await tester.pumpAndSettle();

      final solesparkBg = bg();
      expect(solesparkBg, isNot(equals(blackoutBg)),
          reason:
              'Backdrop must change when the active theme changes — it reads '
              'VisorColorsData.surfacePage from the current Theme');
      expect(
        solesparkBg,
        equals(VisorThemes.solespark.light
            .extension<VisorColorsData>()!
            .surfacePage),
      );
    });
  });
}
