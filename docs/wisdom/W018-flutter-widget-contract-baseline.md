# W018 — Flutter widget quality baseline: built-in matchers + alchemist, never `golden_toolkit`

**Tags:** flutter, testing, a11y, golden, contract
**Source:** [VI-246 research spike](https://linear.app/low-orbit-studio/issue/VI-246) — see [`docs/flutter-widget-quality-contract.md`](../flutter-widget-quality-contract.md).

## What

Two non-obvious findings from the Flutter widget quality contract spike that future ports should treat as baseline:

1. **Flutter's `flutter_test` package ships first-class `meetsGuideline()` matchers.** No third-party a11y testing package is needed for Visor's Required-tier coverage. The four built-ins are:
   - `androidTapTargetGuideline` — ≥ 48 × 48 dp
   - `iOSTapTargetGuideline` — ≥ 44 × 44 pt
   - `labeledTapTargetGuideline` — every interactive widget has a Semantics label
   - `textContrastGuideline` — WCAG 1.4.3 contrast ratios

   Pattern:
   ```dart
   final handle = tester.ensureSemantics();
   await tester.pumpWidget(_wrap(MyWidget(...)));
   await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
   await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
   handle.dispose();
   ```

2. **`golden_toolkit` is discontinued — do not adopt it.** The package was widely used but has not had a meaningful release in ~3 years. The community has migrated to `alchemist` (Betterment + Very Good Ventures, MIT, actively maintained). Alchemist uses the **Ahem font** for CI tests, replacing every glyph with a solid square so golden output is byte-identical across Linux/macOS/Windows. Avoids the entire class of "passes locally on macOS, fails on Linux CI" pain.

   When introducing alchemist in Visor: add as `dev_dependency`, configure `AlchemistConfig` with separate `PlatformGoldensConfig` (local, real fonts) and `CiGoldensConfig` (CI, Ahem font), and run `flutter test --update-goldens` only on Linux to avoid host-OS divergence.

## Why this matters

- The "we need an a11y testing package" instinct burns time. Reach for built-ins first.
- The "let's use golden_toolkit, everyone uses it" instinct is now wrong. Verify maintenance status before adopting any test infra package.

## When this applies

- Any new `visor_*` Flutter widget added to the registry.
- Any ENTR / Veronica / SoleSpark widget audit against the quality contract.
- Any decision about Flutter test infra packages (always check pub.dev "last published" date).

## References

- [`AccessibilityGuideline`](https://api.flutter.dev/flutter/flutter_test/AccessibilityGuideline-class.html) — built-in matchers.
- [`alchemist` on pub.dev](https://pub.dev/packages/alchemist) — current; MIT.
- [`alchemist` GitHub](https://github.com/Betterment/alchemist) — active maintenance.
- [`golden_toolkit` on pub.dev](https://pub.dev/packages/golden_toolkit) — last published ~3 years ago; do not adopt.
- [Flutter widget quality contract](../flutter-widget-quality-contract.md) — full contract this baseline supports.
