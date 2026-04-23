import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:visor_widgetbook/theme/widgetbook_theme.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues(<String, Object>{});
  });

  group('buildVisorThemeEntries()', () {
    test('produces exactly 22 entries (11 themes × 2 modes)', () {
      expect(buildVisorThemeEntries(), hasLength(22));
    });

    test('first entry is the default: Visor / Blackout — Dark', () {
      expect(
        buildVisorThemeEntries().first.name,
        kDefaultVisorWidgetbookTheme,
      );
      expect(kDefaultVisorWidgetbookTheme, 'Visor / Blackout — Dark');
    });

    test('all stock (Visor /) entries precede all custom (Custom /) entries',
        () {
      final names = buildVisorThemeEntries().map((e) => e.name).toList();
      final lastVisor = names.lastIndexWhere((n) => n.startsWith('Visor / '));
      final firstCustom =
          names.indexWhere((n) => n.startsWith('Custom / '));
      expect(lastVisor, greaterThanOrEqualTo(0));
      expect(firstCustom, greaterThanOrEqualTo(0));
      expect(lastVisor, lessThan(firstCustom));
    });

    test('group counts: 8 stock (4×2), 14 custom (7×2)', () {
      final names = buildVisorThemeEntries().map((e) => e.name).toList();
      final stockCount = names.where((n) => n.startsWith('Visor / ')).length;
      final customCount =
          names.where((n) => n.startsWith('Custom / ')).length;
      expect(stockCount, 8);
      expect(customCount, 14);
    });

    test('display names are alphabetized within each group', () {
      List<String> namesFor(String prefix) => buildVisorThemeEntries()
          .map((e) => e.name)
          .where((n) => n.startsWith(prefix))
          // Strip the " — Dark|Light" suffix so sort check keys on display name.
          .map((n) => n.split(' — ').first)
          .toList();

      final stock = namesFor('Visor / ');
      final custom = namesFor('Custom / ');
      final sortedStock = [...stock]..sort();
      final sortedCustom = [...custom]..sort();
      expect(stock, equals(sortedStock));
      expect(custom, equals(sortedCustom));
    });

    test('Dark precedes Light for every theme (alphabetical within theme)',
        () {
      final names = buildVisorThemeEntries().map((e) => e.name).toList();
      for (var i = 0; i < names.length; i += 2) {
        expect(names[i], endsWith(' — Dark'),
            reason: 'Entry at index $i should be Dark: ${names[i]}');
        expect(names[i + 1], endsWith(' — Light'),
            reason: 'Entry at index ${i + 1} should be Light: ${names[i + 1]}');
        final darkBase = names[i].replaceFirst(' — Dark', '');
        final lightBase = names[i + 1].replaceFirst(' — Light', '');
        expect(darkBase, lightBase,
            reason:
                'Adjacent entries must share a theme: $darkBase vs $lightBase');
      }
    });

    test('every label matches the "{Group} / {Name} — {Mode}" format', () {
      final pattern = RegExp(r'^(Visor|Custom) \/ .+ — (Dark|Light)$');
      for (final entry in buildVisorThemeEntries()) {
        expect(pattern.hasMatch(entry.name), isTrue,
            reason: 'Label "${entry.name}" does not match format');
      }
    });

    test('stock-theme classification catches silent drift', () {
      // These are the 4 stock themes per STOCK_THEMES in
      // packages/tokens/src/generate/generate-css.ts. If a new stock theme
      // ships or one is reclassified, this test fails loudly so the widgetbook
      // classification gets updated alongside.
      final names = buildVisorThemeEntries().map((e) => e.name).toList();
      final expectedStockNames = <String>{
        'Visor / Blackout — Dark',
        'Visor / Blackout — Light',
        'Visor / Modern Minimal — Dark',
        'Visor / Modern Minimal — Light',
        'Visor / Neutral — Dark',
        'Visor / Neutral — Light',
        'Visor / Space — Dark',
        'Visor / Space — Light',
      };
      final actualStockNames =
          names.where((n) => n.startsWith('Visor / ')).toSet();
      expect(actualStockNames, equals(expectedStockNames));
    });
  });

  group('persistence', () {
    test('SharedPreferences round-trips the theme label', () async {
      final prefs = await SharedPreferences.getInstance();
      const label = 'Custom / Veronica — Light';
      await prefs.setString(kVisorWidgetbookThemePrefsKey, label);
      expect(prefs.getString(kVisorWidgetbookThemePrefsKey), label);
    });

    test('setMockInitialValues seeds the persisted label for restoration',
        () async {
      SharedPreferences.setMockInitialValues(<String, Object>{
        kVisorWidgetbookThemePrefsKey: 'Custom / Veronica — Light',
      });
      final prefs = await SharedPreferences.getInstance();
      expect(
        prefs.getString(kVisorWidgetbookThemePrefsKey),
        'Custom / Veronica — Light',
      );
    });
  });

  group('reorderForInitial()', () {
    test('moves the persisted label to index 0', () {
      final entries = buildVisorThemeEntries();
      const label = 'Custom / Veronica — Light';
      final reordered = reorderForInitial(entries, label);
      expect(reordered.first.name, label);
      expect(reordered, hasLength(entries.length));
    });

    test('returns an equivalent list when the label is unknown', () {
      final entries = buildVisorThemeEntries();
      final reordered = reorderForInitial(entries, 'Nope / Missing — Dark');
      expect(reordered.map((e) => e.name).toList(),
          equals(entries.map((e) => e.name).toList()));
    });

    test('is a no-op when the label is already at index 0', () {
      final entries = buildVisorThemeEntries();
      final reordered =
          reorderForInitial(entries, kDefaultVisorWidgetbookTheme);
      expect(reordered.first.name, kDefaultVisorWidgetbookTheme);
      expect(reordered, hasLength(entries.length));
    });
  });
}
