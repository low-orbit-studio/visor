import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import 'visor_settings_tile.dart';

Widget _wrap(Widget child) {
  return MaterialApp(
    theme: VisorTheme.build(
      colors: testColors(),
      brightness: Brightness.light,
    ),
    home: Scaffold(body: child),
  );
}

void main() {
  group('VisorSettingsTile', () {
    testWidgets('renders the provided label', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorSettingsTile(
          icon: Icons.person_outline,
          label: 'Account',
        )),
      );
      expect(find.text('Account'), findsOneWidget);
    });

    testWidgets('renders the leading icon', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorSettingsTile(
          icon: Icons.person_outline,
          label: 'Account',
        )),
      );
      expect(find.byIcon(Icons.person_outline), findsOneWidget);
    });

    testWidgets('shows default chevron caret when trailing is null',
        (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorSettingsTile(
          icon: Icons.person_outline,
          label: 'Account',
        )),
      );
      expect(find.byIcon(Icons.chevron_right), findsOneWidget);
    });

    testWidgets('renders subtitle when provided', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorSettingsTile(
          icon: Icons.person_outline,
          label: 'Account',
          subtitle: 'Manage your profile',
        )),
      );
      expect(find.text('Manage your profile'), findsOneWidget);
    });

    testWidgets('omits subtitle when null', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorSettingsTile(
          icon: Icons.person_outline,
          label: 'Account',
        )),
      );
      // Only the label Text widget should be present (no subtitle Text).
      expect(find.byType(Text), findsOneWidget);
    });

    testWidgets('renders custom trailing widget when provided', (tester) async {
      await tester.pumpWidget(
        _wrap(VisorSettingsTile(
          icon: Icons.notifications_outlined,
          label: 'Notifications',
          trailing: Switch(value: true, onChanged: (_) {}),
        )),
      );
      expect(find.byType(Switch), findsOneWidget);
      // Default caret should not appear.
      expect(find.byIcon(Icons.chevron_right), findsNothing);
    });

    testWidgets('fires onTap callback when tapped', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        _wrap(VisorSettingsTile(
          icon: Icons.person_outline,
          label: 'Account',
          onTap: () => tapped = true,
        )),
      );
      await tester.tap(find.byType(InkWell));
      await tester.pump();
      expect(tapped, isTrue);
    });

    testWidgets('does not fire when onTap is null', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        _wrap(VisorSettingsTile(
          icon: Icons.person_outline,
          label: 'Account',
          onTap: null,
        )),
      );
      // Tapping a null InkWell should be a no-op.
      await tester.tap(find.byType(InkWell), warnIfMissed: false);
      await tester.pump();
      expect(tapped, isFalse);
    });

    testWidgets('destructive variant renders without error', (tester) async {
      await tester.pumpWidget(
        _wrap(VisorSettingsTile(
          icon: Icons.logout,
          label: 'Sign out',
          destructive: true,
          onTap: () {},
        )),
      );
      expect(find.text('Sign out'), findsOneWidget);
    });

    testWidgets('selected variant renders without error', (tester) async {
      await tester.pumpWidget(
        _wrap(VisorSettingsTile(
          icon: Icons.person_outline,
          label: 'Account',
          selected: true,
          onTap: () {},
        )),
      );
      expect(find.text('Account'), findsOneWidget);
      // A Container with a non-null color should be present for the highlight.
      final container = tester.widgetList<Container>(find.byType(Container))
          .firstWhere((c) => c.color != null, orElse: () => throw StateError(
                'Expected a Container with a background color for selected state',
              ));
      expect(container.color, isNotNull);
    });

    testWidgets('semanticLabel overrides accessibility label', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorSettingsTile(
          icon: Icons.logout,
          label: 'Sign out',
          semanticLabel: 'Sign out of your account',
        )),
      );
      expect(
        find.bySemanticsLabel('Sign out of your account'),
        findsOneWidget,
      );
    });

    // R11 — tap-target size (meetsGuideline)
    testWidgets('default tile meets Android tap target guideline',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(VisorSettingsTile(
          icon: Icons.person_outline,
          label: 'Account',
          onTap: () {},
        )),
      );
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      handle.dispose();
    });

    testWidgets('tile with subtitle meets Android tap target guideline',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(VisorSettingsTile(
          icon: Icons.person_outline,
          label: 'Account',
          subtitle: 'Manage your profile',
          onTap: () {},
        )),
      );
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      handle.dispose();
    });

    testWidgets(
        'tile with custom Switch trailing meets Android tap target guideline',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(VisorSettingsTile(
          icon: Icons.notifications_outlined,
          label: 'Push notifications',
          trailing: Switch(value: true, onChanged: (_) {}),
          onTap: null,
        )),
      );
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      handle.dispose();
    });

    // Rec5 — textContrastGuideline (VI-257)

    testWidgets('default tile renders with sufficient text contrast',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(VisorSettingsTile(
          icon: Icons.person_outline,
          label: 'Account',
          onTap: () {},
        )),
      );
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });

    testWidgets('tile with subtitle renders with sufficient text contrast',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(VisorSettingsTile(
          icon: Icons.person_outline,
          label: 'Account',
          subtitle: 'Manage your profile',
          onTap: () {},
        )),
      );
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });

    testWidgets('destructive tile renders with sufficient text contrast',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(VisorSettingsTile(
          icon: Icons.logout,
          label: 'Sign out',
          destructive: true,
          onTap: () {},
        )),
      );
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });
  });
}
