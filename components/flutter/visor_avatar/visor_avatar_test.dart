import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import 'visor_avatar.dart';

Widget _wrap(Widget child, {TextDirection textDirection = TextDirection.ltr}) {
  return MaterialApp(
    theme: VisorTheme.build(
      colors: testColors(),
      brightness: Brightness.light,
    ),
    home: Directionality(
      textDirection: textDirection,
      child: Scaffold(body: Center(child: child)),
    ),
  );
}

void main() {
  group('VisorAvatar', () {
    // -------------------------------------------------------------------------
    // Smoke / default state
    // -------------------------------------------------------------------------

    testWidgets('renders without error using all defaults', (tester) async {
      await tester.pumpWidget(_wrap(const VisorAvatar()));
      expect(find.byType(VisorAvatar), findsOneWidget);
      expect(find.byType(CircleAvatar), findsOneWidget);
    });

    testWidgets('uses default radius of 22', (tester) async {
      await tester.pumpWidget(_wrap(const VisorAvatar()));
      final sizedBox = tester.widget<SizedBox>(find.byType(SizedBox).first);
      expect(sizedBox.width, 44); // 22 * 2
      expect(sizedBox.height, 44);
      final avatar = tester.widget<CircleAvatar>(find.byType(CircleAvatar));
      expect(avatar.radius, 22);
    });

    // -------------------------------------------------------------------------
    // Photo URL branch
    // -------------------------------------------------------------------------

    testWidgets('uses CachedNetworkImageProvider when photoUrl is set',
        (tester) async {
      await tester.pumpWidget(_wrap(const VisorAvatar(
        photoUrl: 'https://example.com/photo.jpg',
        radius: 32,
      )));
      final avatar = tester.widget<CircleAvatar>(find.byType(CircleAvatar));
      expect(avatar.backgroundImage, isA<CachedNetworkImageProvider>());
    });

    testWidgets('SizedBox reflects custom radius when photoUrl is set',
        (tester) async {
      const testRadius = 40.0;
      await tester.pumpWidget(_wrap(const VisorAvatar(
        photoUrl: 'https://example.com/photo.jpg',
        radius: testRadius,
      )));
      final sizedBox = tester.widget<SizedBox>(find.byType(SizedBox).first);
      expect(sizedBox.width, testRadius * 2);
      expect(sizedBox.height, testRadius * 2);
    });

    testWidgets('does not show fallback child when photoUrl is set',
        (tester) async {
      await tester.pumpWidget(_wrap(const VisorAvatar(
        photoUrl: 'https://example.com/photo.jpg',
        name: 'John Doe',
        radius: 32,
      )));
      // CircleAvatar child should be null — no initials Text visible.
      expect(find.text('JD'), findsNothing);
    });

    // -------------------------------------------------------------------------
    // Initials fallback
    // -------------------------------------------------------------------------

    testWidgets('shows initials when name is provided and no photoUrl',
        (tester) async {
      await tester.pumpWidget(_wrap(const VisorAvatar(
        name: 'John Doe',
        radius: 32,
      )));
      expect(find.text('JD'), findsOneWidget);
      final avatar = tester.widget<CircleAvatar>(find.byType(CircleAvatar));
      expect(avatar.backgroundImage, isNull);
    });

    testWidgets('extracts up to 3 characters for single-word names',
        (tester) async {
      await tester.pumpWidget(_wrap(const VisorAvatar(
        name: 'Madonna',
        radius: 32,
      )));
      expect(find.text('MAD'), findsOneWidget);
    });

    testWidgets('extracts first letter of up to 3 words for multi-word names',
        (tester) async {
      await tester.pumpWidget(_wrap(const VisorAvatar(
        name: 'John Paul George Ringo',
        radius: 32,
      )));
      // First 3 words: John, Paul, George → JPG
      expect(find.text('JPG'), findsOneWidget);
    });

    testWidgets('extracts 2 characters for a 2-letter single-word name',
        (tester) async {
      await tester.pumpWidget(_wrap(const VisorAvatar(
        name: 'Jo',
        radius: 32,
      )));
      expect(find.text('JO'), findsOneWidget);
    });

    testWidgets('handles names with multiple spaces gracefully', (tester) async {
      await tester.pumpWidget(_wrap(const VisorAvatar(
        name: '  John   Doe  ',
        radius: 32,
      )));
      expect(find.text('JD'), findsOneWidget);
    });

    // -------------------------------------------------------------------------
    // Default icon fallback
    // -------------------------------------------------------------------------

    testWidgets('shows user icon when no photoUrl and no name', (tester) async {
      await tester.pumpWidget(_wrap(const VisorAvatar(radius: 32)));
      expect(find.byIcon(PhosphorIconsBold.user), findsOneWidget);
      expect(find.byType(Text), findsNothing);
    });

    testWidgets('shows user icon when name is an empty string', (tester) async {
      await tester.pumpWidget(_wrap(const VisorAvatar(
        name: '',
        radius: 32,
      )));
      expect(find.byIcon(PhosphorIconsBold.user), findsOneWidget);
      expect(find.byType(Text), findsNothing);
    });

    // -------------------------------------------------------------------------
    // onTap / GestureDetector
    // -------------------------------------------------------------------------

    testWidgets('does not wrap in GestureDetector when onTap is null',
        (tester) async {
      await tester.pumpWidget(_wrap(const VisorAvatar(radius: 32)));
      expect(find.byType(GestureDetector), findsNothing);
    });

    testWidgets('wraps in GestureDetector with opaque hit-test when onTap set',
        (tester) async {
      await tester.pumpWidget(_wrap(VisorAvatar(
        radius: 32,
        onTap: () {},
      )));
      final gd = tester.widget<GestureDetector>(find.byType(GestureDetector));
      expect(gd.behavior, HitTestBehavior.opaque);
    });

    testWidgets('invokes onTap callback when tapped', (tester) async {
      var tapped = false;
      await tester.pumpWidget(_wrap(VisorAvatar(
        radius: 32,
        onTap: () => tapped = true,
      )));
      await tester.tap(find.byType(VisorAvatar));
      await tester.pump();
      expect(tapped, isTrue);
    });

    testWidgets('uses Stack when onTap is provided', (tester) async {
      await tester.pumpWidget(_wrap(VisorAvatar(
        radius: 32,
        onTap: () {},
      )));
      expect(
        find.descendant(
          of: find.byType(VisorAvatar),
          matching: find.byType(Stack),
        ),
        findsOneWidget,
      );
    });

    testWidgets('does not use Stack when onTap is null', (tester) async {
      await tester.pumpWidget(_wrap(const VisorAvatar(radius: 32)));
      expect(
        find.descendant(
          of: find.byType(VisorAvatar),
          matching: find.byType(Stack),
        ),
        findsNothing,
      );
    });

    // -------------------------------------------------------------------------
    // Loading overlay
    // -------------------------------------------------------------------------

    testWidgets('shows CircularProgressIndicator overlay when isLoading true',
        (tester) async {
      await tester.pumpWidget(_wrap(VisorAvatar(
        photoUrl: 'https://example.com/photo.jpg',
        radius: 32,
        isLoading: true,
        onTap: () {},
      )));
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      expect(find.byType(Positioned), findsOneWidget);
    });

    testWidgets('hides loading overlay when isLoading false', (tester) async {
      await tester.pumpWidget(_wrap(VisorAvatar(
        photoUrl: 'https://example.com/photo.jpg',
        radius: 32,
        isLoading: false,
        onTap: () {},
      )));
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });

    testWidgets(
        'loading overlay is absent when isLoading true but onTap is null',
        (tester) async {
      // Overlay is only rendered inside the interactive Stack branch.
      await tester.pumpWidget(_wrap(const VisorAvatar(
        photoUrl: 'https://example.com/photo.jpg',
        radius: 32,
        isLoading: true,
      )));
      expect(find.byType(CircularProgressIndicator), findsNothing);
    });

    testWidgets(
        'loading overlay uses static border when disableAnimations is true',
        (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: VisorTheme.build(
            colors: testColors(),
            brightness: Brightness.light,
          ),
          home: MediaQuery(
            data: const MediaQueryData(disableAnimations: true),
            child: Scaffold(
              body: VisorAvatar(
                photoUrl: 'https://example.com/photo.jpg',
                radius: 32,
                isLoading: true,
                onTap: () {},
              ),
            ),
          ),
        ),
      );
      // CircularProgressIndicator should NOT be present; static border is shown.
      expect(find.byType(CircularProgressIndicator), findsNothing);
      // At least one DecoratedBox is present (the overlay static border ring).
      expect(find.byType(DecoratedBox), findsWidgets);
    });

    // -------------------------------------------------------------------------
    // Semantics
    // -------------------------------------------------------------------------

    testWidgets('wraps interactive avatar in Semantics button', (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(VisorAvatar(
        radius: 32,
        onTap: () {},
      )));
      expect(find.bySemanticsLabel('Avatar'), findsOneWidget);
      handle.dispose();
    });

    testWidgets('uses custom semanticLabel when provided', (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(VisorAvatar(
        radius: 32,
        onTap: () {},
        semanticLabel: 'View profile',
      )));
      expect(find.bySemanticsLabel('View profile'), findsOneWidget);
      handle.dispose();
    });

    testWidgets('does not add button Semantics node when non-interactive',
        (tester) async {
      final handle = tester.ensureSemantics();
      // Non-interactive: onTap is null — no button semantics node should exist.
      await tester.pumpWidget(_wrap(const VisorAvatar(radius: 32)));
      // Assert no node with isButton flag is present in the avatar subtree.
      final semanticsData = tester.getSemantics(find.byType(VisorAvatar));
      expect(semanticsData.flagsCollection.isButton, isFalse);
      handle.dispose();
    });

    // -------------------------------------------------------------------------
    // Accessibility guidelines — interactive avatars with 48dp tap-target
    // -------------------------------------------------------------------------

    testWidgets(
        'meetsGuideline: interactive avatar at radius 24 satisfies Android tap-target',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(VisorAvatar(
        radius: 24, // 48dp diameter — exactly M3 minimum
        onTap: () {},
        semanticLabel: 'Avatar',
      )));
      await expectLater(
        tester,
        meetsGuideline(androidTapTargetGuideline),
      );
      handle.dispose();
    });

    testWidgets(
        'meetsGuideline: interactive avatar at radius 24 is labeled for accessibility',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(VisorAvatar(
        radius: 24,
        onTap: () {},
        semanticLabel: 'Avatar',
      )));
      await expectLater(
        tester,
        meetsGuideline(labeledTapTargetGuideline),
      );
      handle.dispose();
    });

    // Rec5 — textContrastGuideline (VI-257)

    testWidgets('initials fallback renders with sufficient text contrast',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(const VisorAvatar(
        name: 'John Doe',
        radius: 32,
      )));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });

    // -------------------------------------------------------------------------
    // R9 — Directionality respect
    // -------------------------------------------------------------------------

    testWidgets('renders without overflow or exception under RTL',
        (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorAvatar(), textDirection: TextDirection.rtl),
      );
      expect(tester.takeException(), isNull);
      expect(find.byType(VisorAvatar), findsOneWidget);
    });
  });
}
