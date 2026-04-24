import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import 'visor_loading_indicator.dart';

Widget _wrap(Widget child, {bool disableAnimations = false}) {
  return MediaQuery(
    data: MediaQueryData(disableAnimations: disableAnimations),
    child: MaterialApp(
      theme: VisorTheme.build(
        colors: testColors(),
        brightness: Brightness.light,
      ),
      home: Scaffold(body: Center(child: child)),
    ),
  );
}

void main() {
  group('VisorLoadingIndicator', () {
    // -----------------------------------------------------------------------
    // Immediate render (no delay)
    // -----------------------------------------------------------------------

    testWidgets('renders a CircularProgressIndicator immediately when no delay',
        (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorLoadingIndicator()),
      );
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('default size is 24 dp', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorLoadingIndicator()),
      );
      final sized = tester.widgetList<SizedBox>(find.byType(SizedBox)).firstWhere(
            (s) => s.width == 24.0 && s.height == 24.0,
            orElse: () => throw StateError('Expected 24x24 SizedBox'),
          );
      expect(sized.width, 24.0);
      expect(sized.height, 24.0);
    });

    testWidgets('custom size is applied', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorLoadingIndicator(size: 48.0)),
      );
      final sized = tester.widgetList<SizedBox>(find.byType(SizedBox)).firstWhere(
            (s) => s.width == 48.0 && s.height == 48.0,
            orElse: () => throw StateError('Expected 48x48 SizedBox'),
          );
      expect(sized.width, 48.0);
    });

    testWidgets('Duration.zero delay is treated as immediate (no stateful gate)',
        (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorLoadingIndicator(delay: Duration.zero)),
      );
      // Should render immediately — no shrink box
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    // -----------------------------------------------------------------------
    // Delay gate (stateful path)
    // -----------------------------------------------------------------------

    testWidgets('spinner is absent before delay elapses', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorLoadingIndicator(
          delay: Duration(milliseconds: 300),
        )),
      );
      // Immediately after pump — spinner not yet visible
      expect(find.byType(CircularProgressIndicator), findsNothing);

      // Drain the pending timer so the test framework doesn't complain about
      // a pending timer at teardown.
      await tester.pump(const Duration(milliseconds: 300));
    });

    testWidgets('spinner appears after delay elapses', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorLoadingIndicator(
          delay: Duration(milliseconds: 300),
        )),
      );
      expect(find.byType(CircularProgressIndicator), findsNothing);

      // Advance fake clock past the delay
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('no setState-after-dispose error when widget disposed during delay',
        (tester) async {
      // Mount the delayed indicator
      await tester.pumpWidget(
        _wrap(const VisorLoadingIndicator(
          delay: Duration(milliseconds: 300),
        )),
      );

      // Dispose before the delay fires by swapping to a different widget
      await tester.pumpWidget(
        _wrap(const SizedBox()),
      );

      // Advance past the original delay — should produce no errors
      await tester.pump(const Duration(milliseconds: 300));
      // No assertion needed — absence of error IS the test
    });

    // -----------------------------------------------------------------------
    // Reduce-motion
    // -----------------------------------------------------------------------

    testWidgets('renders static box instead of spinner when disableAnimations',
        (tester) async {
      await tester.pumpWidget(
        _wrap(
          const VisorLoadingIndicator(),
          disableAnimations: true,
        ),
      );
      expect(find.byType(CircularProgressIndicator), findsNothing);
      expect(find.byType(DecoratedBox), findsOneWidget);
    });

    testWidgets('static reduce-motion box matches requested size', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const VisorLoadingIndicator(size: 32.0),
          disableAnimations: true,
        ),
      );
      final sized = tester.widgetList<SizedBox>(find.byType(SizedBox)).firstWhere(
            (s) => s.width == 32.0 && s.height == 32.0,
            orElse: () => throw StateError('Expected 32x32 SizedBox'),
          );
      expect(sized.width, 32.0);
    });

    // -----------------------------------------------------------------------
    // Color
    // -----------------------------------------------------------------------

    testWidgets('applies custom color to spinner', (tester) async {
      const customColor = Color(0xFFFF0000);
      await tester.pumpWidget(
        _wrap(const VisorLoadingIndicator(color: customColor)),
      );
      final indicator = tester.widget<CircularProgressIndicator>(
        find.byType(CircularProgressIndicator),
      );
      final animated = indicator.valueColor as AlwaysStoppedAnimation<Color>;
      expect(animated.value, customColor);
    });

    testWidgets('uses interactivePrimaryBg token when no color supplied',
        (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorLoadingIndicator()),
      );
      final indicator = tester.widget<CircularProgressIndicator>(
        find.byType(CircularProgressIndicator),
      );
      final animated = indicator.valueColor as AlwaysStoppedAnimation<Color>;
      // testColors() sets interactivePrimaryBg = 0xFF2563EB
      expect(animated.value, const Color(0xFF2563EB));
    });
  });
}
