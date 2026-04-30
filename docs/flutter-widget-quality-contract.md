# Flutter Widget Quality Contract

> **Status:** Draft — pending human approval (VI-246)
> **Ticket:** [VI-246](https://linear.app/low-orbit-studio/issue/VI-246)
> **Scope:** All `visor_*` Flutter widgets shipped through the Visor copy-and-own registry.

## Purpose

This contract is the gating bar a Flutter widget must clear before it can be marked production-ready and consumed by ENTR, Veronica, SoleSpark, or any other Low Orbit project. Without it, "is this widget good enough?" stays subjective, Wave 2 ports cannot be reviewed against a fixed standard, and the existing 9 widgets cannot be audited consistently.

The bar is **researched, not invented** — each contract item below cites prior art from Material 3, Flutter framework docs, peer libraries (`forui`, `shadcn_ui`, `fluent_ui`, `FlexColorScheme`), and the WCAG 2.2 AA quick reference. Citation count must equal or exceed contract item count.

---

## How to use this contract

1. **Authoring a new widget** — work through the Required column. Every Required item must be "yes" before the widget PR is merged.
2. **Reviewing a widget PR** — paste the Required checklist into the PR description, mark each item, attach evidence (test names, screenshots, golden file paths).
3. **Auditing an existing widget** — fill in a row in the [Audit table](#audit) below; each ❌/⚠️ in a Required cell spawns a Wave 2 follow-up ticket via [`linear.py create`](#follow-up-tickets).

The contract is intentionally **tiered** so a widget at "Required" parity ships safely while "Recommended"/"Stretch" items track investments worth making over time:

| Tier | Meaning | Gate |
|------|---------|------|
| **Required** | Blocks port from being marked Done. | Every Required item must pass for a widget to be Production-Ready. |
| **Recommended** | Strong default. Opt-out must be documented in the widget's `.visor.yaml` or doc page. | Reviewer may waive with rationale; track waivers in audit. |
| **Stretch** | Nice-to-have; surfaced in audit, never blocks. | Surface in audit; use to prioritise quality investments. |

---

## Source material

This contract synthesises patterns from the libraries and standards below. Each row in the [Contract](#contract) section cites at least one of these.

| ID | Source | Type | Why it matters |
|----|--------|------|----------------|
| S1 | [`ThemeExtension` API](https://api.flutter.dev/flutter/material/ThemeExtension-class.html) | Flutter framework | Canonical token-distribution mechanism — `copyWith` + `lerp` are mandatory. |
| S2 | [Flutter accessibility guide](https://docs.flutter.dev/ui/accessibility-and-internationalization/accessibility) | Flutter framework | Defines WCAG/Section 508/EN 301 549 obligations and Flutter primitives. |
| S3 | [`AccessibilityGuideline`](https://api.flutter.dev/flutter/flutter_test/AccessibilityGuideline-class.html) | Flutter framework | Built-in `androidTapTargetGuideline`, `iOSTapTargetGuideline`, `textContrastGuideline`, `labeledTapTargetGuideline` matchers. |
| S4 | [`Semantics` widget](https://api.flutter.dev/flutter/widgets/Semantics-class.html) | Flutter framework | Screen-reader contract for widgets. |
| S5 | [`MediaQueryData.disableAnimations`](https://api.flutter.dev/flutter/widgets/MediaQueryData/disableAnimations.html) | Flutter framework | Reduce-motion read path. |
| S6 | [Material 3 — accessibility](https://m3.material.io/foundations/accessible-design/overview) | Design system | 48dp touch target, focus rings, reduced motion. |
| S7 | [Material 3 — components](https://m3.material.io/components) | Design system | Anatomy diagrams + state matrices for component pages. |
| S8 | [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/) | Standard | Contrast 1.4.3, focus visible 2.4.7, target size minimum 2.5.8. |
| S9 | [WCAG 2.5.8 — Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) | Standard | New AA criterion in WCAG 2.2 (24×24 floor). |
| S10 | [forui pub.dev](https://pub.dev/packages/forui) and [forui docs](https://forui.dev/docs) | Peer library | Verified-publisher Flutter UI library; theme + CLI + per-widget docs structure. |
| S11 | [shadcn_ui pub.dev](https://pub.dev/packages/shadcn_ui) | Peer library | Flutter port of shadcn/ui; uses `theme_extensions_builder_annotation`. |
| S12 | [fluent_ui pub.dev](https://pub.dev/packages/fluent_ui) | Peer library | Microsoft Fluent for Flutter; multi-tone accent swatches and 30+ baked locales. |
| S13 | [FlexColorScheme pub.dev](https://pub.dev/packages/flex_color_scheme) | Peer library | `FlexSubThemesData` model — per-component theming as a configuration product. |
| S14 | [`gap` package](https://pub.dev/packages/gap) | Peer library | Single-purpose-widget exemplar — narrow scope, crystal-clear API. |
| S15 | [Flutter widget tests cookbook](https://docs.flutter.dev/cookbook/testing/widget/introduction) | Flutter framework | Widget vs integration test boundary. |
| S16 | [`alchemist` pub.dev](https://pub.dev/packages/alchemist) and [GitHub](https://github.com/Betterment/alchemist) | Peer library | Modern golden-test framework; Ahem font for cross-OS determinism. Maintained by Betterment + VGV. |
| S17 | [`golden_toolkit`](https://pub.dev/packages/golden_toolkit) | Peer library | **Discontinued**; cited only as a "do not adopt" data point ([discussion thread](https://github.com/wger-project/flutter/issues/732), [Flutter testing recap](https://dev.to/3lvv0w/flutter-mobile-testing-methodologies-recap-2025-523j)). |
| S18 | [`golden_screenshot`](https://pub.dev/packages/golden_screenshot) | Peer library | Active alternative with fuzzy comparator. |
| S19 | [Widgetbook docs](https://docs.widgetbook.io) and [pub.dev](https://pub.dev/packages/widgetbook) | Peer library | Knobs, addons, theme/locale shells; Cloud tier adds visual regression. |
| S20 | [shadcn/ui — Button doc](https://ui.shadcn.com/docs/components/button) | Peer library | Per-widget doc page anatomy: preview → install → usage → variants → accessibility → API. |
| S21 | [WCAG 2.4.7 — Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) | Standard | Focus ring obligation. |
| S22 | [`Semantics` / `MergeSemantics` / `ExcludeSemantics` patterns](https://syedabdulbasit7.medium.com/enhancing-flutter-apps-with-semantics-mergedsemantics-and-excludesemantics-for-accessibility-and-fe41397de6f3) | Reference write-up | Practical guidance for screen-reader merge/exclude. |
| S23 | [`ThemeExtension` introduction PR](https://github.com/flutter/flutter/pull/98033) and [theming write-up](https://medium.com/@abied.abiad/mastering-flutter-theming-a-pros-guide-with-themeextension-043839eb72e9) | Reference | Background on why `lerp` matters during theme animation. |

---

## Contract

Contract IDs are stable (`R1`…`Rn`, `Rec1`…`Recn`, `S1`…`Sn`). Audit cells reference these IDs.

### Required (R) — blocks "Production-Ready"

| ID | Item | Why | Source |
|----|------|-----|--------|
| **R1** | **No hard-coded colors, sizes, radii, durations, or shadows.** Every visual constant reads from a `context.visor*` token extension (`visorColors`, `visorSpacing`, `visorRadius`, `visorMotion`, `visorOpacity`, `visorStrokeWidths`, `visorTextStyles`, `visorShadows`). | Tokens are the entire point of Visor; literals defeat theme switching. | S1, S10, S11, S13 |
| **R2** | **Token extensions implement `copyWith` + `lerp`.** This is verified at the `visor_core` package level (not per-widget) but a widget that introduces a new extension must conform. | `lerp` is required for theme-animation correctness; `copyWith` for `Theme.of(context).copyWith(...)` ergonomics. | S1, S23 |
| **R3** | **Public API uses named parameters with sensible defaults.** Required parameters use `required` keyword; never positional. Constructor lives in the widget file, not a separate factory module. | Matches the framework idiom; matches forui / shadcn_ui / fluent_ui conventions. | S10, S11, S12 |
| **R4** | **Single-responsibility scope.** A widget does one thing. Compound widgets compose smaller widgets; they don't grow internal modes that should be sibling widgets. | `gap` exemplar; avoids mode-explosion. | S14 |
| **R5** | **Doc comments on the class and every public field.** Class-level docstring includes a runnable Dart `dartdoc` example. Field-level docstrings explain *what* and *when* to use, not *how the implementation works*. | Required for `dart doc`; matches forui's API-link pattern. | S10, S20 |
| **R6** | **Interactive widgets wrap their tap surface in `Semantics(button: true, label: …, enabled: …)`.** Decorative subtrees use `ExcludeSemantics`; logical groups use `MergeSemantics`. A `semanticLabel` named param overrides the default label. | Screen-reader contract; baseline a11y. | S2, S4, S22 |
| **R7** | **Touch targets ≥ 48 × 48 dp** (Material 3 floor) for any interactive widget. Verified by `androidTapTargetGuideline` + `labeledTapTargetGuideline` in the widget test file. | Material 3 mandates 48dp; iOS HIG mandates 44pt; both exceed WCAG 2.5.8's 24×24 floor. | S3, S6, S8, S9 |
| **R8** | **Animations honour `MediaQuery.of(context).disableAnimations`.** Looping spinners/transitions must short-circuit to a static representation when the platform requests reduced motion. | Accessibility — vestibular sensitivity. | S2, S5, S6 |
| **R9** | **Layout respects `Directionality.of(context)`.** No `EdgeInsets.fromLTRB` for paddings that should mirror; use `EdgeInsetsDirectional` and `Alignment*Directional` when sides matter. | RTL languages (Arabic, Hebrew, Farsi) are first-class. | S2 |
| **R10** | **Widget test file alongside source.** Lives at `<name>_test.dart` next to `<name>.dart`. Covers: smoke render, default state, every public-prop branch (variants/sizes), disabled/loading state, semantic label override, tap callback wiring. | Matches the established Visor pattern; mirrors forui's tested-codebase claim. | S15, S10 |
| **R11** | **Widget test exercises `meetsGuideline()` for tap target + label.** `tester.ensureSemantics()` + `androidTapTargetGuideline` + `labeledTapTargetGuideline`. Skipped only for non-interactive widgets, with a `// not applicable: non-interactive` comment. | Built-in matchers; zero extra deps. | S3 |
| **R12** | **`<name>.visor.yaml` registry manifest is present and valid.** Includes `name`, `description`, `category`, `when_to_use`, `when_not_to_use`, `files`, `pubDependencies` minimum. | Powers the `npx visor add` CLI; required for distribution. | (Visor internal) |
| **R13** | **No third-party `pub.dev` dependency without explicit Decisions Made entry in the widget ticket.** `visor_core` is always allowed. Anything else (e.g. `phosphor_flutter`, `cached_network_image`) must be justified, license-checked, and named in the widget's `.visor.yaml` `pubDependencies`. | Consumer ownership — every dep is a forced install. | S10, S11 |

### Recommended (Rec) — strong default; document opt-out

| ID | Item | Why | Source |
|----|------|-----|--------|
| **Rec1** | **Golden tests via `alchemist`.** Cross-OS deterministic snapshots with the Ahem font, light/dark theme matrix, key states (default/hover/focus/disabled). | Catches visual regressions; Ahem font eliminates Linux/macOS divergence. | S16 |
| **Rec2** | **Visible focus ring on focusable widgets.** Uses `--focus-ring-width` and `--focus-ring-offset` tokens. Tested via `FocusableActionDetector` or direct `Focus` integration. | WCAG 2.4.7. | S8, S21 |
| **Rec3** | **Per-widget Widgetbook use-case** under `apps/widgetbook/` (or wherever Widgetbook lives). Knobs cover every public param. | Live preview is the docs site's preview source; powers visual regression. | S19 |
| **Rec4** | **Tap-target test runs both Android and iOS guidelines** (`androidTapTargetGuideline` *and* `iOSTapTargetGuideline`). | Multi-platform parity. | S3, S6 |
| **Rec5** | **Contrast guideline test** for any widget rendering text on a token background — `meetsGuideline(textContrastGuideline)`. | WCAG 1.4.3 verification at the unit level. | S3, S8 |
| **Rec6** | **RTL widget test** — pumps the widget once with `Directionality(textDirection: TextDirection.rtl)` and asserts no overflow / no exception. Golden snapshots optional but encouraged. | Validates R9 in CI, not just at review time. | S2 |
| **Rec7** | **`Semantics(liveRegion: true)`** on widgets that announce status changes (toasts, error views, async validation). | TalkBack/VoiceOver announce. | S4 |
| **Rec8** | **Per-widget doc page** in `packages/docs/content/docs/flutter/<name>.mdx` with anatomy: 1-line description → preview (Widgetbook embed) → import → minimal usage → variants → props table → a11y notes → tokens-used. | Production-quality peer parity. | S7, S10, S20 |

### Stretch (S) — nice-to-have; surface in audit

| ID | Item | Why | Source |
|----|------|-----|--------|
| **St1** | **Multi-locale golden coverage** — at minimum English + one RTL locale (Arabic recommended) + one wide-glyph locale (Japanese or Chinese) under `Directionality.rtl` + `Localizations.override(...)`. | i18n confidence at production parity. | S2, S12 |
| **St2** | **Text-scale golden coverage** — pump at `MediaQuery(textScaler: TextScaler.linear(2.0))` and snapshot. | Catches dynamic-type regressions. | S6 |
| **St3** | **Performance budget** documented per widget — e.g. `build()` allocations, no `setState` in `didChangeDependencies` without rationale. | Runtime quality. | S15 |
| **St4** | **Lints: `flutter_lints` clean, no widget-level overrides** beyond what `analysis_options.yaml` already permits. | Codebase consistency. | (Visor internal) |
| **St5** | **Visual regression via Widgetbook Cloud or `golden_screenshot`** running per PR with a baselined diff threshold. | Catches subtler regressions than alchemist alone. | S18, S19 |

---

## D5 decisions

These five decisions were left open in the VI-246 ticket and are resolved here.

### D5(a) — Golden test framework

| Option | Pros | Cons | License | Maintenance |
|--------|------|------|---------|-------------|
| **`alchemist`** ✅ | Ahem font for cross-OS determinism; explicit `PlatformGoldensConfig` / `CiGoldensConfig`; maintained by Betterment + Very Good Ventures; published <2 months ago. | Adds a dev_dependency to every widget package. | MIT | **Active.** |
| `golden_toolkit` | Familiar API (was widely used). | **Discontinued** — last meaningful release ~3 years ago. | BSD-3 | Discontinued. |
| `golden_screenshot` | Newer, MIT, fuzzy pixel comparator. | Smaller community; less mature. | MIT | Active. |
| Raw `matchesGoldenFile` | Zero deps. | No CI determinism story; manual font/theme setup; Linux/macOS divergence likely. | BSD-3 | (framework) |

**Decision:** **`alchemist`** for Recommended-tier golden coverage. Raw `matchesGoldenFile` is acceptable as a temporary baseline; `golden_toolkit` is explicitly disallowed (W018). `golden_screenshot` may be added later for visual-regression tier (St5) without replacing alchemist. Sources: S16, S17, S18.

### D5(b) — Required theme/mode coverage in tests

| Option | Pros | Cons |
|--------|------|------|
| Every test runs **light + dark** | Catches palette regressions. | Doubles golden surface. |
| Every test runs **default theme only**; goldens cover both | Smaller test surface; goldens still catch regressions. | Logic-only tests miss dark-mode regressions in conditional code. |
| **Light + dark in goldens; default in widget tests** ✅ | Widget tests stay fast; goldens catch palette regressions; matches FlexColorScheme audit posture. | Requires widget devs to write at least the "default goldens" path. |

**Decision:** Widget tests run the default theme (light) only. Golden tests run **light + dark** for every widget at the Recommended tier. Sources: S13, S16.

### D5(c) — Accessibility testing approach

| Option | Pros | Cons |
|--------|------|------|
| **Built-in `meetsGuideline()` matchers** ✅ | Zero extra deps; covers tap target + label + contrast; first-party. | Fewer assertion options than a dedicated package. |
| Third-party a11y package | Richer assertions. | Yet another dep; less stable; redundant with built-ins. |
| Manual `tester.getSemantics(...)` only | Maximum control. | Easy to write inconsistent assertions; missed coverage of WCAG basics. |

**Decision:** Use Flutter's built-in `meetsGuideline()` matchers (`androidTapTargetGuideline`, `iOSTapTargetGuideline`, `labeledTapTargetGuideline`, `textContrastGuideline`) as the per-widget baseline. Allow `tester.getSemantics(...)` and `find.bySemanticsLabel` for behavior-specific assertions. Sources: S3, S4, S22.

### D5(d) — Per-widget MDX docs vs Widgetbook-only

| Option | Pros | Cons |
|--------|------|------|
| **Widgetbook only** | Zero MDX maintenance; lives next to the widget. | Public docs site gains nothing for Flutter; no SEO; harder for AI agents to consume. |
| **MDX only** | Fully integrated with the docs site; AI-consumable; matches React widget docs. | No live preview without Widgetbook embed; props table written by hand. |
| **Both — Widgetbook for preview, MDX for everything else** ✅ | Each medium does what it's best at; MDX embeds the Widgetbook preview iframe. | Two surfaces to keep in sync. Surface drift is the risk. |

**Decision:** **Both.** Widgetbook hosts every interactive use-case (knobs, theme switcher); a thin MDX page at `packages/docs/content/docs/flutter/<name>.mdx` provides the canonical doc anatomy (description → embedded Widgetbook preview → import → usage → variants → props table → a11y notes → tokens-used) and is what `https://visor.design` serves. This becomes a **Recommended** tier item (Rec8) — not Required — until `packages/docs` actually has a Flutter section ([VI-205](https://linear.app/low-orbit-studio/issue/VI-205) is the enabler ticket). Sources: S7, S10, S19, S20.

### D5(e) — `quality:certified` Linear label

| Option | Pros | Cons |
|--------|------|------|
| **Introduce `quality:certified` label** ✅ | Visible, queryable signal that a widget passes the contract. | One more label to maintain. |
| Use ticket state (`Done`) | No new label. | Conflates "ticket is closed" with "widget meets contract" — they aren't the same. |
| No label, doc-only | Minimal process. | Audit table can drift; no source of truth. |

**Decision:** Introduce a `quality:certified` Linear label. A widget gets the label when (a) the audit row shows ✅ on every Required item, (b) the widget's most recent PR was reviewed against this contract. Lose the label when any Required item regresses (caught by the audit refresh — see [How this contract evolves](#how-this-contract-evolves)). Source: S13 (treats theming/quality as a configuration product, by analogy).

---

## Audit

Audit current at the time of writing (VI-246 PR). Each ❌ in a Required column spawns a follow-up ticket; ⚠️ tracks partial coverage that may or may not warrant a ticket (judgment call by reviewer). Cells are evaluated against the source code in `components/flutter/`.

Legend: ✅ pass · ⚠️ partial · ❌ fail · — not applicable

### Required-tier audit

| Widget | R1 tokens | R3 named-API | R4 single-resp | R5 doc | R6 Semantics | R7 48dp | R8 reduce-motion | R9 RTL | R10 tests | R11 a11y matcher | R12 yaml | R13 deps |
|--------|----|----|----|----|----|----|----|----|----|----|----|----|
| `visor_button` | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ size=sm is a compact non-primary tap-target variant (VI-252 D2) — md + lg ✅ via `meetsGuideline`; sm intentionally compact | ⚠️ spinner uses `CircularProgressIndicator` without `disableAnimations` short-circuit | ✅ | ✅ | ✅ md + lg pass `androidTapTargetGuideline` + `labeledTapTargetGuideline`; semanticLabel override passes `labeledTapTargetGuideline`; sm documented as compact variant (VI-252) | ✅ | ✅ |
| `visor_empty_state` | ✅ | ✅ | ✅ | ✅ | ❌ no Semantics on container; relies on child text | — non-interactive at root (action slot is caller-owned) | — | ✅ VI-258 explicit RTL test added | ✅ | — non-interactive | ⚠️ yaml lacks `pubDependencies` declaration mismatch — verify | ✅ |
| `visor_empty_state_card` | ✅ | ✅ | ✅ | ✅ | ✅ inherits Semantics container from `VisorEmptyState` (VI-247); `semanticLabel` pass-through (VI-249) | — | — | ✅ VI-258 explicit RTL test added | ✅ | — | ⚠️ verify yaml | ✅ |
| `visor_loading_indicator` | ✅ | ✅ | ✅ | ✅ | ❌ no `Semantics(label: 'Loading')` or `liveRegion` | — non-interactive | ✅ checks `disableAnimations`, returns static border | ✅ VI-258 explicit RTL test added | ✅ | — non-interactive | ✅ | ✅ |
| `visor_otp_input` | ✅ | ✅ | ✅ | ✅ | ⚠️ verify per-digit Semantics labels and `MergeSemantics` | ⚠️ digit boxes likely exceed 48dp; needs `meetsGuideline` proof | ⚠️ no explicit reduce-motion path for auto-advance focus | ✅ VI-258 explicit RTL test added; digit row reverses in RTL; documented as locale-neutral | ✅ | ❌ no `meetsGuideline` calls | ✅ | ✅ |
| `visor_section_header` | ✅ | ✅ | ✅ | ✅ | — non-interactive (text only) | — | — | ✅ VI-258 explicit RTL tests added (default + trailing) | ✅ | — non-interactive | ⚠️ verify yaml | ✅ |
| `visor_settings_tile` | ✅ | ✅ | ✅ | ✅ | ✅ has `Semantics(button: true, label: …)` and `excludeSemantics` for child | ⚠️ vertical=`spacing.lg` + content height; verify ≥ 48dp | — no animations | ✅ VI-258 explicit RTL test added; chevron glyph does not auto-mirror (documented, see VI-259) | ✅ | ❌ no `meetsGuideline` calls | ⚠️ verify yaml | ✅ |
| `visor_stat_card` | ✅ | ✅ | ✅ | ✅ | ❌ no Semantics; relies on Text Semantics | — non-interactive | — | ✅ VI-258 explicit RTL test added; delta arrows are semantic (not layout-directional) | ✅ | — non-interactive | ⚠️ verify yaml | ✅ |
| `visor_text_input` | ✅ | ✅ | ✅ | ✅ | ✅ wraps in `Semantics`; `semanticLabel` param | ⚠️ verify field height ≥ 48dp at all sizes | ⚠️ floating-label animation does not short-circuit on `disableAnimations` | ✅ VI-258 explicit RTL test added | ✅ | ❌ no `meetsGuideline` calls | ✅ | ✅ |

### Recommended-tier audit

| Widget | Rec1 alchemist | Rec2 focus ring | Rec3 widgetbook | Rec4 iOS tap | Rec5 contrast | Rec6 RTL test | Rec7 liveRegion | Rec8 MDX page |
|--------|----|----|----|----|----|----|----|----|
| `visor_avatar` | ❌ | — | ⚠️ confirm | ❌ | ✅ VI-257 | ✅ VI-258 | — | ✅ VI-259 |
| `visor_back_button` | ❌ | — | ⚠️ confirm | — | ❌ | ✅ pre-existing | — | ✅ VI-259 |
| `visor_button` | ✅ | ⚠️ relies on Material default | ⚠️ confirm | ❌ | ✅ VI-257 | ✅ VI-258 | — | ✅ VI-259 |
| `visor_chip` | ❌ | ⚠️ relies on Material default | ⚠️ confirm | ❌ | ✅ VI-257 | ✅ VI-258 | — | ✅ VI-259 |
| `visor_chip_search_input` | ❌ | ⚠️ relies on Material default | ⚠️ confirm | ❌ | ✅ VI-257 | ✅ VI-258 | — | ✅ VI-259 |
| `visor_confirm_sheet` | ❌ | — | ⚠️ confirm | — | ✅ VI-257 | ✅ VI-258 | — | ✅ VI-259 |
| `visor_empty_state` | ❌ | — | ⚠️ confirm | — | ✅ VI-257 | ✅ VI-258 | — | ✅ VI-259 |
| `visor_empty_state_card` | ❌ | — | ⚠️ confirm | — | ❌ | ✅ VI-258 | — | ✅ VI-259 |
| `visor_error_view` | ❌ | — | ⚠️ confirm | — | ✅ VI-257 | ✅ pre-existing | ⚠️ candidate for error-text `liveRegion` | ✅ VI-259 |
| `visor_form_dialog` | ❌ | — | ⚠️ confirm | — | ❌ | ✅ VI-258 | — | ✅ VI-259 |
| `visor_loading_dots` | ❌ | — | ⚠️ confirm | — | — | ✅ VI-258 | — | ✅ VI-259 |
| `visor_loading_indicator` | ❌ | — | ⚠️ confirm | — | — | ✅ VI-258 | ⚠️ candidate for `liveRegion` when status changes | ✅ VI-259 |
| `visor_otp_input` | ❌ | ⚠️ relies on Material focus default | ⚠️ confirm | ❌ | ❌ | ✅ VI-258 | — | ✅ VI-259 |
| `visor_password_input` | ❌ | ⚠️ relies on Material default | ⚠️ confirm | ❌ | ✅ VI-257 | ✅ VI-258 | — | ✅ VI-259 |
| `visor_phone_input` | ❌ | ⚠️ relies on Material default | ⚠️ confirm | ❌ | ✅ VI-257 | ✅ VI-258 | — | ✅ VI-259 |
| `visor_rich_text` | ❌ | — | ⚠️ confirm | — | ❌ | ✅ VI-258 | — | ✅ VI-259 |
| `visor_section_header` | ❌ | — | ⚠️ confirm | — | ✅ VI-257 | ✅ VI-258 | — | ✅ VI-259 |
| `visor_settings_tile` | ❌ | ⚠️ Material `InkWell` default | ⚠️ confirm | ❌ | ✅ VI-257 | ✅ VI-258 | — | ✅ VI-259 |
| `visor_snack_bar` | ❌ | — | ⚠️ confirm | — | ✅ VI-257 | ✅ VI-258 | ✅ | ✅ VI-259 |
| `visor_stat_card` | ❌ | — | ⚠️ confirm | — | ✅ VI-257 | ✅ VI-258 | — | ✅ VI-259 |
| `visor_text_input` | ❌ | ⚠️ has token-driven border-focus color but no token-driven outer focus ring | ⚠️ confirm | ❌ | ✅ VI-257 | ✅ VI-258 | ⚠️ candidate for error-text `liveRegion` | ✅ VI-259 |

### Audit summary

- **Required-tier failures** (❌ cells, must spawn a follow-up ticket): 9 across 5 widgets — see [Follow-up tickets](#follow-up-tickets).
- **Required-tier partials** (⚠️ cells, judgment-call): 16 — listed below; reviewer decides whether to spawn a ticket per item.
- **Recommended-tier failures**: pervasive — every widget except `visor_button` fails Rec1 (alchemist); every widget fails Rec5 (contrast guideline) and Rec6 (RTL test). These are batched per-tier follow-ups, not per-widget. **VI-256 lands the alchemist scaffolding** (dev_dependency, project-wide `flutter_test_config.dart`, CI lane, contributor docs) plus one example golden test on `visor_button` covering the style × size × theme matrix; subsequent per-widget golden coverage rolls into each Wave 2 widget's PR. **VI-259 (this PR) closes Rec8** — every widget now has a canonical MDX page on `visor.design`.

---

## Follow-up tickets

Per D4: every Required ❌ spawns a follow-up Wave 2 ticket linked back to VI-246. Created via `linear.py create` immediately after this contract is approved.

| Source widget | Failed item | Ticket | Tier |
|---------------|-------------|--------|------|
| `visor_empty_state` | R6 Semantics | [VI-247](https://linear.app/low-orbit-studio/issue/VI-247) — Audit gap: `visor_empty_state` — add Semantics container | Required |
| `visor_empty_state_card` | R6 Semantics | [VI-249](https://linear.app/low-orbit-studio/issue/VI-249) — Audit gap: `visor_empty_state_card` — add Semantics container | Required |
| `visor_loading_indicator` | R6 Semantics | [VI-250](https://linear.app/low-orbit-studio/issue/VI-250) — Audit gap: `visor_loading_indicator` — add Semantics label | Required |
| `visor_stat_card` | R6 Semantics | [VI-251](https://linear.app/low-orbit-studio/issue/VI-251) — Audit gap: `visor_stat_card` — add Semantics container | Required |
| `visor_button` | R11 a11y matcher | [VI-252](https://linear.app/low-orbit-studio/issue/VI-252) — Audit gap: `visor_button` — add `meetsGuideline` tap-target/label tests | Required |
| `visor_otp_input` | R6 + R11 | [VI-253](https://linear.app/low-orbit-studio/issue/VI-253) — Audit gap: `visor_otp_input` — add `meetsGuideline` + per-digit Semantics | Required |
| `visor_settings_tile` | R11 a11y matcher | [VI-254](https://linear.app/low-orbit-studio/issue/VI-254) — Audit gap: `visor_settings_tile` — add `meetsGuideline` tap-target test | Required |
| `visor_text_input` | R11 a11y matcher | [VI-255](https://linear.app/low-orbit-studio/issue/VI-255) — Audit gap: `visor_text_input` — add `meetsGuideline` tap-target/label/contrast tests | Required |

Plus four Recommended-tier batch tickets (one per cross-cutting Rec item):

| Batch ticket | Scope |
|--------------|-------|
| [VI-256](https://linear.app/low-orbit-studio/issue/VI-256) — Rec1: introduce `alchemist` golden test scaffolding | Add `alchemist` dev_dependency; one example golden test on `visor_button`; CI lane. |
| [VI-257](https://linear.app/low-orbit-studio/issue/VI-257) — Rec5: contrast guideline tests for text-on-token widgets | Add `meetsGuideline(textContrastGuideline)` to button, empty_state, settings_tile, stat_card, text_input. |
| [VI-258](https://linear.app/low-orbit-studio/issue/VI-258) — Rec6: RTL widget tests across all 21 widgets | ✅ Done — One `Directionality.rtl` test per widget; assert no overflow/exception. All 19 widgets received explicit RTL tests (2 already had coverage). |
| [VI-259](https://linear.app/low-orbit-studio/issue/VI-259) — Rec8: per-widget MDX docs | ✅ Done — 17 new MDX pages plus iframe-and-when-to-use backfill on the 4 existing pages (`button`, `empty-state`, `section-header`, `stat-card`). All 21 widgets now satisfy Rec8. |

Tickets get the labels: `Flutter`, `Improvement`, `quality:audit-gap`. The latter is created if it does not yet exist.

---

## How this contract evolves

- The contract is versioned by ID (R*, Rec*, S*). New items append; existing items are not renumbered.
- Whenever an item is added/changed/removed, a row is added to the changelog at the bottom of this doc.
- A periodic audit refresh (target: every Wave/release) re-runs the audit table against current `main` and updates ✅/⚠️/❌ in place. Drift is caught by diffing the previous audit row against the new row.
- A widget loses `quality:certified` if any Required cell regresses to ❌ in the next refresh.

---

## Cross-references

- [Flutter Widget Candidates (VI-219)](./flutter-widget-candidates.md) — what's eligible for Wave 2 ports.
- [Flutter UI ↔ Visor Rosetta Stone (VI-243)](./migration/flutter-ui-rosetta-stone.md) — token translation reference for migrations.
- [Flutter Theme Consumption guide](../packages/docs/content/docs/guides/flutter-themes.mdx) — how consumers use generated `ThemeData`.
- [`docs/wisdom/W018-flutter-widget-contract-baseline.md`](./wisdom/W018-flutter-widget-contract-baseline.md) — captured findings from this spike.
- [Visor README — Flutter section](../README.md) — top-level entry point.
- [Visor `MIGRATION.md` — Flutter section](./MIGRATION.md) — consumer migration guide.

---

## Changelog

| Date | Change | Driver |
|------|--------|--------|
| Initial draft | First version: 13 Required, 8 Recommended, 5 Stretch items; audit of 9 widgets; D5 resolved. | VI-246 |
| Rec1 scaffolding lands | `alchemist` dev_dependency, `flutter_test_config.dart` (CI goldens only — Ahem font), Linux CI lane, `flutter test --update-goldens` workflow documented in `CONTRIBUTING.md`, exemplar golden suite on `visor_button` (style × size × theme = 24 button cells across 6 PNGs). | VI-256 |
| Rec5 contrast tests land | `meetsGuideline(textContrastGuideline)` added to 14 widget test files: visor_avatar, visor_button (3 style variants), visor_chip (4 variant/selection combos), visor_chip_search_input, visor_confirm_sheet (2 variants), visor_empty_state (2 layouts), visor_error_view, visor_password_input, visor_phone_input, visor_section_header, visor_settings_tile (3 variants), visor_snack_bar (3 variants), visor_stat_card (3 delta combos), visor_text_input. All pass under default light theme. Audit table Rec5 column updated to ✅ for covered widgets. | VI-257 |
