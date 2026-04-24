import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:visor_themes/visor_themes.dart';
import 'package:visor_widgetbook/persistence.dart';
import 'package:visor_widgetbook/theme/widgetbook_theme.dart';
import 'package:widgetbook/widgetbook.dart';

// Key used to locate the probe widget inside the use-case subtree.
const Key _probeKey = Key('theme-probe');

/// Builds a minimal [Widgetbook] harness with the same ThemeAddon wiring as
/// [VisorWidgetbookApp] but with a single stub use case (the "probe") so tests
/// stay hermetic and avoid depending on generated directories.
///
/// [themeMode] is fixed to [ThemeMode.dark] by default so tests that compare
/// primary colors work deterministically without a brightness toggle.
Widgetbook _buildHarness({
  required List<WidgetbookTheme<VisorThemePair>> entries,
  required String initialLabel,
  List<WidgetbookIntegration>? integrations,
  ThemeMode themeMode = ThemeMode.dark,
}) {
  final initial = entries.firstWhere(
    (e) => e.name == initialLabel,
    orElse: () => entries.first,
  );
  return Widgetbook(
    // Navigate directly to the probe so the use case is visible on first frame.
    initialRoute: '/?path=probe',
    directories: [
      WidgetbookUseCase(
        name: 'Probe',
        builder: (_) => Builder(
          key: _probeKey,
          builder: (ctx) => ColoredBox(
            color: Theme.of(ctx).colorScheme.primary,
          ),
        ),
      ),
    ],
    appBuilder: (_, child) => child,
    integrations: integrations,
    addons: [
      ThemeAddon<VisorThemePair>(
        themes: entries,
        initialTheme: initial,
        themeBuilder: (context, pair, child) => MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: pair.light,
          darkTheme: pair.dark,
          themeMode: themeMode,
          home: Material(child: child),
        ),
      ),
    ],
  );
}

/// Returns the [ColorScheme.primary] color currently resolved inside the probe
/// by reading [Theme.of(ctx).colorScheme.primary] via the probe's element.
Color _probeColor(WidgetTester tester) {
  final probeContext = tester.element(find.byKey(_probeKey));
  return Theme.of(probeContext).colorScheme.primary;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('ThemeAddon wiring — end-to-end', () {
    testWidgets(
        'selecting a different theme changes ColorScheme.primary in the use case',
        (tester) async {
      final entries = buildVisorThemePairs();
      const labelA = 'Visor / Blackout';
      const labelB = 'Visor / Neutral';

      await tester.pumpWidget(_buildHarness(
        entries: entries,
        initialLabel: labelA,
      ));
      await tester.pumpAndSettle();

      // Probe must be visible after routing to /?path=probe.
      expect(find.byKey(_probeKey), findsOneWidget,
          reason: 'Probe use case not rendered — routing may have failed');

      final colorA = _probeColor(tester);

      // Simulate the ThemeAddon dropdown changing to a different theme.
      final probeContext = tester.element(find.byKey(_probeKey));
      WidgetbookState.of(probeContext).updateQueryField(
        group: 'theme',
        field: 'name',
        value: labelB,
      );
      await tester.pumpAndSettle();

      final colorB = _probeColor(tester);

      expect(colorA, isNot(equals(colorB)),
          reason:
              'Primary color did not change after ThemeAddon selection — '
              'MaterialApp.theme is not wired to the selected ThemeData');
    });

    testWidgets(
        'initialTheme from persisted label sets first-frame theme independently '
        'of reorderForInitial', (tester) async {
      const persistedLabel = 'Custom / Veronica';
      final entries = buildVisorThemePairs();

      // Derive the expected primary color directly from the entry's pair.
      final veronicaEntry =
          entries.firstWhere((e) => e.name == persistedLabel);
      final defaultEntry =
          entries.firstWhere((e) => e.name == kDefaultVisorWidgetbookTheme);

      // Sanity: these two themes must have different dark primaries for the test
      // to be meaningful.
      expect(
        veronicaEntry.data.dark.colorScheme.primary,
        isNot(equals(defaultEntry.data.dark.colorScheme.primary)),
        reason: 'Veronica and Blackout must differ in primary for this test '
            'to be meaningful',
      );

      // Pump with initialLabel = Veronica; the probe must show its dark primary.
      await tester.pumpWidget(_buildHarness(
        entries: entries,
        initialLabel: persistedLabel,
      ));
      await tester.pumpAndSettle();
      expect(find.byKey(_probeKey), findsOneWidget);

      final actualPrimary = _probeColor(tester);

      expect(
        actualPrimary,
        equals(veronicaEntry.data.dark.colorScheme.primary),
        reason:
            'First-frame theme was not driven by initialTheme — '
            'MaterialApp.darkTheme did not reflect the persisted label',
      );
    });
  });

  group('VisorThemePersistenceIntegration', () {
    testWidgets(
        'onChange persists new theme label to SharedPreferences when selection changes',
        (tester) async {
      final prefs = await SharedPreferences.getInstance();
      final entries = buildVisorThemePairs();
      const initialLabel = kDefaultVisorWidgetbookTheme;
      const newLabel = 'Custom / Veronica';

      final integration = VisorThemePersistenceIntegration(
        prefs: prefs,
        initialLabel: initialLabel,
      );

      await tester.pumpWidget(_buildHarness(
        entries: entries,
        initialLabel: initialLabel,
        integrations: [integration],
      ));
      await tester.pumpAndSettle();

      expect(find.byKey(_probeKey), findsOneWidget);

      // Trigger an addon selection change.
      final probeContext = tester.element(find.byKey(_probeKey));
      WidgetbookState.of(probeContext).updateQueryField(
        group: 'theme',
        field: 'name',
        value: newLabel,
      );
      await tester.pumpAndSettle();

      expect(
        prefs.getString(kVisorWidgetbookThemePrefsKey),
        equals(newLabel),
        reason:
            'SharedPreferences was not updated after ThemeAddon selection change',
      );
    });
  });
}
