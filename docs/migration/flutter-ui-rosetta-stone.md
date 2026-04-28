# Flutter UI ↔ Visor Rosetta Stone

> A token-by-token translation reference for migrating Low Orbit Flutter consumer code (SoleSpark, ENTR, Veronica `packages/ui/`) to Visor's Flutter target conventions.

## Who this is for

- **Widget porters** — VI-2xx Flutter widget-port tickets. Look up source identifiers; copy Visor equivalents.
- **The SoleSpark migration** (Phase 10a M4) — mass-rewrite consumer code without per-file judgment calls.
- **AI agents** — deterministic translation table; no ambiguity, no re-derivation.

## How to use

1. Find your source repo column (SoleSpark, ENTR, Veronica).
2. Locate the source identifier or token category.
3. Read the **Visor** column for the target.
4. Read **Notes** for caveats. `GAP → VI-N` rows mean no Visor equivalent exists yet — see [Token gaps](#token-gaps).
5. For full context on a specific category, the source identifier inventories live in each source repo's `lib/src/`.

## Source conventions at a glance

**SoleSpark** — `~/Code/solespark/solespark-app/solespark-client/packages/ui`. Sealed-class static constants: `UIColors.*`, `UISpacing.*`, `UIBorderRadius.*`, `UISizedBox.*`, `UIEdgeInsets.*`, `UITextStyles.*`, `UIShadows.*`, `UIDurations.*`. Dark theme only. No `Theme.of(context)` extension surface — components reference statics directly. Furthest from Visor.

**ENTR** — `~/Code/zeitguest/entr/client/packages/ui`. Hybrid two-axis system. Axis A: `UIColors.*` static constants (brand + extensive opacity palettes). Axis B: `Theme.of(context).colorScheme.*` Material 3 roles wired in `ui_theme.dart` from Axis A. Consumer code uses whichever fits — both must be mapped. No dedicated radius/shadow/motion classes (values inline in `ui_theme.dart`).

**Veronica** — `~/Code/veronica/veronica-home/veronica-client/packages/ui`. `context.colorway.*` extension pattern (defined in `ui_colorway_provider.dart`). Closest analog to Visor's `context.visorColors`. Four colorways (morning/afternoon/goldenHour/peakMagic) swap the entire semantic surface. Brand-specific `UIPrimaryColors.goldenHour*` are intentionally non-portable.

## Visor target surface

Seven consumer-facing extensions on `BuildContext`:

| Extension | Surface |
|---|---|
| `context.visorColors` | Text, surface, border, interactive — 49 tokens |
| `context.visorSpacing` | `xs`, `sm`, `md`, `lg`, `xl`, `xxl`, `xxxl` — 7 tokens |
| `context.visorTextStyles` | Material 3 + `labelXSmall` — 16 tokens |
| `context.visorRadius` | `sm`, `md`, `lg`, `xl`, `pill` — 5 tokens |
| `context.visorShadows` | `xs`, `sm`, `md`, `lg`, `xl` — 5 tokens (multi-layer) |
| `context.visorStrokeWidths` | `thin`, `regular`, `medium`, `thick` — 4 tokens |
| `context.visorMotion` | `durationFast`, `durationNormal`, `durationSlow`, `easing` — 4 tokens |

Tokens are the only consumer-facing surface. `context.visor*` accessors reflect the active theme — components stay theme-agnostic.

---

## Colors

Rows are organized by **Visor target token** (destination-keyed). For ENTR, axis A (`UIColors.*`) and axis B (`colorScheme.*`) sit in the same cell separated by `/`. Opacity variants of source colors are not enumerated — see [Opacity variants](#opacity-variants) below.

### Text

| Visor (`context.visorColors`) | SoleSpark (`UIColors`) | ENTR (`UIColors` / `colorScheme`) | Veronica (`context.textColors` / `UIPrimaryColors`) | Notes |
|---|---|---|---|---|
| `textPrimary` | `text` (`#FFFFFF`) | `text` / `onSurface` | `.primary` | Body / heading text |
| `textSecondary` | `white60o` | `hint` (`light70o`) / `onSurfaceVariant` | `.secondary` | Subtitles, muted |
| `textTertiary` | `hintText` (`white70o`) / `white40o` | `dimmed` (`light40o`) | `.tertiary` | Hints, deemphasized |
| `textDisabled` | `white40o` | `light40o` | `.disabled` | Inactive text |
| `textInverse` | — (use `background`) | `dark` (graphite) / `onPrimary` | `.inverse` | Text on brand surfaces |
| `textInverseSecondary` | — | `dark70o` (approximation) | — | No exact source equivalent |
| `textLink` | `accentSecondary` | `secondary` (aqua) | — | Use `interactivePrimaryBg` for stronger emphasis |
| `textLinkHover` | — | — | — | New territory; pick a darker shade in theme |
| `textSuccess` | `success` (`#34C759`) | `success` (= `primary` spring) | `.colorway.success` | Status / positive |
| `textWarning` | `warning` (`#FFCC00`) | — | — | ENTR/Veronica do not surface a warning text role |
| `textError` | `error` (`#FF3B30`) | `error` (hotCoralSex) / `error` | `.colorway.error` | Errors, destructive |
| `textInfo` | — | — | — | New in Visor; no source equivalent |

### Surface

| Visor (`context.visorColors`) | SoleSpark (`UIColors`) | ENTR (`UIColors` / `colorScheme`) | Veronica (`context.bgColors`) | Notes |
|---|---|---|---|---|
| `surfacePage` | `background` (`#1A1F22`) | `background` (graphite) / — | `.primary` | Root background |
| `surfaceCard` | `surface` (`#242628`) | `surface` (`#242628`) / `surface` | `.surface` | Cards, containers |
| `surfaceSubtle` | `surfaceVariant` (`#2E3033`) | — | `.secondary` | Subtle layered surface |
| `surfaceMuted` | `outlineVariant` (`#2D3034`) | — | `.tertiary` | Muted areas |
| `surfaceOverlay` | — (use `black40o`) | — (use `dark40o`) | `.overlay` / `.modalBarrier` | Modal scrims |
| `surfaceInteractiveDefault` | `white5o` (approx) | `light5o` (approx) | — | Hover-able surface base |
| `surfaceInteractiveHover` | `white10o` | `light10o` | `.interactionColors.hover` | Hover state |
| `surfaceInteractiveActive` | `white20o` | `light20o` | `.interactionColors.pressed` | Pressed/active |
| `surfaceInteractiveDisabled` | `white5o` | `light5o` | `.interactionColors.disabled` | Disabled background |
| `surfaceAccentSubtle` | `accentPrimary10o` | `primary10o` | — | Subtle accent fill |
| `surfaceAccentDefault` | `accentPrimary20o` | `primary20o` | — | Default accent fill |
| `surfaceAccentStrong` | `accentPrimary50o` | `primary50o` | — | Strong accent fill |
| `surfaceSuccessSubtle` | — | `successContainer` (`sage` 20%) | — | Success bg subtle |
| `surfaceSuccessDefault` | `success` | `primary` (spring) | — | Success bg solid |
| `surfaceWarningSubtle` | — | — | — | New in Visor |
| `surfaceWarningDefault` | `warning` | — | — | ENTR/Veronica skip warning |
| `surfaceErrorSubtle` | — | `errorContainer` | — | Error bg subtle |
| `surfaceErrorDefault` | `error` | `error` / `error` | `.colorway.error` | Error bg solid |
| `surfaceInfoSubtle` | — | — | — | New in Visor |
| `surfaceInfoDefault` | — | — | — | New in Visor |
| **`surfaceSelected`** | — (proxy: `white10o`) | — (proxy: `light10o`) | — | **GAP → [VI-242](https://linear.app/low-orbit-studio/issue/VI-242)** |

### Border

| Visor (`context.visorColors`) | SoleSpark (`UIColors`) | ENTR (`UIColors` / `colorScheme`) | Veronica (`context.borderColors`) | Notes |
|---|---|---|---|---|
| `borderDefault` | `outline` (`#3A3D42`) | `light20o` / `outline` | `.defaultColor` | Form borders, dividers |
| `borderMuted` | `outlineVariant` (`#2D3034`) | `light10o` | — | Subtle dividers |
| `borderStrong` | `white40o` | `light40o` | `.strong` | Emphasized borders |
| `borderFocus` | `accentPrimary` | `primary` (spring) | `.focus` | Focus rings |
| `borderDisabled` | `white10o` | `light10o` | — | Disabled outlines |
| `borderSuccess` | `success` | `primary` | `.colorway.success` | Valid-state border |
| `borderWarning` | `warning` | — | — | Warning outlines |
| `borderError` | `error` | `error` / `error` | `.colorway.error` | Error-state border |
| `borderInfo` | — | — | — | New in Visor |

### Interactive

| Visor (`context.visorColors`) | SoleSpark (`UIColors`) | ENTR (`UIColors` / `colorScheme`) | Veronica (`context.buttonColors`) | Notes |
|---|---|---|---|---|
| `interactivePrimaryBg` | `accentPrimary` (`#6952D9`) | `primary` (spring) / `primary` | `.primary` | Primary CTA bg |
| `interactivePrimaryBgHover` | `accentSecondary` (lighter) | `primary60o` | — | Hover; theme-tuned |
| `interactivePrimaryBgActive` | `accentPrimary50o` | `primary80o` | — | Pressed |
| `interactivePrimaryText` | `text` (white) | `dark` (graphite) / `onPrimary` | `.colorway.text.inverse` | Label on primary bg |
| `interactiveSecondaryBg` | `white10o` | `light10o` | `.secondary` | Secondary button bg |
| `interactiveSecondaryBgHover` | `white20o` | `light20o` | — | Hover |
| `interactiveSecondaryBgActive` | `white30o` (approx) | `light30o` | — | Pressed |
| `interactiveSecondaryText` | `text` (white) | `cloud` / `onSurface` | `.colorway.text.primary` | Label on secondary bg |
| `interactiveSecondaryBorder` | `outline` | `light30o` | `.borderColors.defaultColor` | Outlined-button border |
| `interactiveDestructiveBg` | `error` | `error` | `.colorway.error` | Destructive CTA bg |
| `interactiveDestructiveBgHover` | — (darken) | — (darken) | — | Theme-tuned darker shade |
| `interactiveDestructiveText` | `text` (white) | `cloud` | `.colorway.text.inverse` | Label on destructive bg |
| `interactiveGhostBg` | — (transparent) | — (transparent) | — (transparent) | Ghost button (no bg) |
| `interactiveGhostBgHover` | `white5o` | `light5o` | `.interactionColors.hover` | Ghost hover bg |

### Opacity variants

All three source repos ship rich opacity palettes — SoleSpark `accentPrimary{10,20,50}o` / `white{5,10,20,40,60,80}o` / `black{10,20,40,60}o`; ENTR `light{0..90}o` / `dark{0..90}o` / `black{0..90}o` / `white{0..90}o` / `primary{10..90}o`; Veronica `graphite{4,5,8,10,30,40,70,80}o`.

Visor's canonical scale is the 8-slot `context.visorOpacity` extension: `alpha5, alpha10, alpha12, alpha20, alpha40, alpha50, alpha60, alpha80` (CSS: `--opacity-{5,10,12,20,40,50,60,80}`). The scale is fixed across themes — opacity is a math primitive, not a brand decision.

**Translation rule:** look up the base color in the relevant Visor cluster (Text / Surface / Border / Interactive), then apply the matching opacity slot via `context.visorOpacity.alphaN`:

```dart
final colors = context.visorColors;
final opacity = context.visorOpacity;

// SoleSpark: UIColors.white40o
// ENTR:      UIColors.light40o
// Veronica:  UIPrimaryColors.offWhitePure.withOpacity(0.4)
colors.textPrimary.withValues(alpha: opacity.alpha40);
```

**Source-suffix → Visor slot mapping:**

| Source suffix | Visor slot | Notes |
|---|---|---|
| `5o` | `alpha5` | Barely-there overlays |
| `10o` | `alpha10` | Subtle hover/pressed, M3 splash base |
| `12o` (rare) | `alpha12` | M3 state-overlay standard |
| `20o` | `alpha20` | Emphasized overlays |
| `30o` (Veronica) | `alpha20` or `alpha40` | Pick closest by visual intent — no exact match |
| `40o` | `alpha40` | Disabled-state blends |
| `50o` | `alpha50` | Half-tone scrim |
| `60o` | `alpha60` | Heavy overlay |
| `70o` (Veronica) | `alpha60` or `alpha80` | Pick closest by visual intent — no exact match |
| `80o` | `alpha80` | Strong scrim |
| `0o`, `90o` (ENTR edges) | — | Fully transparent / near-opaque; use `Colors.transparent` or solid color |

Source `8o` (Veronica) and any other off-scale value → round to nearest slot. Visor decision D3 (VI-245): the scale is fixed, not extended per migration.

### Brand-specific / non-portable colors

| Source identifier | Repo | Reason non-portable |
|---|---|---|
| `UIColors.accentTertiary` (`#FF00C8` magenta) | SoleSpark | Brand-locked tertiary accent; consumer overrides at theme layer, not widget |
| `UIColors.sellerPrimary` / `sellerSecondary` / `sellerTertiary` | SoleSpark | Dual-mode buyer/seller branding; not a Visor concern |
| `UIColors.hotCoralSex`, `aqua`, `apricot`, `sage` | ENTR | Brand palette; consumer maps to its own theme |
| `UIPrimaryColors.goldenHour{3pm..7pm}` (warm gold gradient) | Veronica | Veronica brand identity |
| `UIPrimaryColors.glow{Whisper,Blush,Peach,Sunset,Peak}` | Veronica | Brand accent glows |
| `BgColors.warmth{1..6}` | Veronica | Brand-specific warm-surface gradient |
| `SpecialColors.veronicaGlow`, `swipeLike`, `swipePass`, `diagonalLight` | Veronica | App-specific feature accents |

**Override pattern:** consumer projects keep brand colors in their own theme file (e.g., `solespark.visor.yaml`) and reference them via theme overrides — they do not need a Visor namespace slot.

---

## Spacing

Visor's spacing scale is small and uniform. Source scales are larger; map to the closest Visor step. For `padding`/`margin`, Flutter consumers compose `EdgeInsets.symmetric` / `EdgeInsets.all` from `context.visorSpacing.*` — Visor does not ship pre-built EdgeInsets.

| Visor (`context.visorSpacing`) | SoleSpark (`UISpacing` / `UIEdgeInsets` / `UISizedBox`) | ENTR (`UISpacing`) | Veronica (`UISpacing`) | Notes |
|---|---|---|---|---|
| `xs` (4) | `xs` (4) | `xs` (4) | `xs` (4) | Tight gaps |
| `sm` (8) | `sm` (8) | `sm` (8) | `sm` (8) | Inline gaps |
| `md` (12) | `md` (12) | `md` (12) | `md` (12) | Default spacing |
| `lg` (16) | `lg` (16) | `lg` (16) | `lg` (16) | Padding, margins |
| `xl` (24) | `xlg` (24) | `xxl` (24) | `xlg` (24) | Section padding |
| `xxl` (32) | `xxlg` (32) | `xxxl` (32) | — (use `xlg` × 1.33) | Large sections |
| `xxxl` (48) | — (use `xxxlg` 40 + 8, or `xxxxlg` 64) | `xxxxl` (48) | — (use `xxlg` 40 + 8) | Major sections |

**Source-only sizes with no Visor equivalent:**

- SoleSpark `xxxs` (1) / `xxs` (2) — sub-pixel adjustments. Inline as literal `1.0` or `2.0` if needed; not a token scale Visor maintains.
- SoleSpark `xxxxlg` (64) / `xxxxxlg` (88) — hero spacing. Compose multiple Visor `xxxl` steps or use literal.
- Veronica `xxxxlg` (88) — same as SoleSpark; literal.

**Pre-built EdgeInsets / SizedBox helpers (`UIEdgeInsets.allmd`, `UISizedBox.hsm`, etc.):**

These are constructors over the spacing scale, not tokens. Visor consumers write `EdgeInsets.all(context.visorSpacing.md)` and `SizedBox(height: context.visorSpacing.sm)` directly. Patterns map cleanly:

| Source idiom | Visor equivalent |
|---|---|
| `UIEdgeInsets.allmd` | `EdgeInsets.all(spacing.md)` |
| `UIEdgeInsets.hlg` | `EdgeInsets.symmetric(horizontal: spacing.lg)` |
| `UIEdgeInsets.vlg` | `EdgeInsets.symmetric(vertical: spacing.lg)` |
| `UIEdgeInsets.card` (`all(16)`) | `EdgeInsets.all(spacing.lg)` |
| `UIEdgeInsets.button` (`h:16, v:12`) | `EdgeInsets.symmetric(horizontal: spacing.lg, vertical: spacing.md)` |
| `UIEdgeInsets.screen` (`all(24)`) | `EdgeInsets.all(spacing.xl)` |
| `UISizedBox.hsm` (height 8) | `SizedBox(height: spacing.sm)` |
| `UISizedBox.wlg` (width 16) | `SizedBox(width: spacing.lg)` |

---

## Typography

Visor follows Material 3 named slots plus a `labelXSmall` extension. All three source repos roughly mirror the Material 3 hierarchy — though ENTR adds explicit weight variants (`heading{1..6}{Light,Regular,Medium,SemiBold,Bold,ExtraBold}`) that don't exist in Visor; use `.copyWith(fontWeight: ...)` to override.

| Visor (`context.visorTextStyles`) | SoleSpark (`UITextStyles`) | ENTR (`UITextStyles` / Material `textTheme`) | Veronica (`UITextStyles`) | Notes |
|---|---|---|---|---|
| `displayLarge` (57) | `displayLarge` (56) | `displayLarge` (48) | `displayLarge` (46) | Hero size; modest size differences |
| `displayMedium` (45) | `displayMedium` (32) | `displayMedium` (34) | `displayMedium` (36) | — |
| `displaySmall` (36) | `displaySmall` (28) | `displaySmall` (24) | `displaySmall` (28) | — |
| `headlineLarge` (32) | `headlineLarge` (26) | `heading1Light` (34) | `headlineLarge` (24) | — |
| `headlineMedium` (28) | `headlineMedium` (22) | `heading2Bold` (24) | `headlineMedium` (22) | — |
| `headlineSmall` (24) | `headlineSmall` (18) | `heading3Bold` (19) | `headlineSmall` (20) | — |
| `titleLarge` (22) | `titleLarge` (16) | `heading4Bold` (16) | `titleLarge` (18) | — |
| `titleMedium` (16) | `titleMedium` (14) | `heading5Bold` (14) | `titleMedium` (16) | — |
| `titleSmall` (14) | `titleSmall` (13) | `heading6Bold` (12) | `titleSmall` (14) | — |
| `bodyLarge` (16) | `bodyLarge` (16) | `bodyLargeMedium` (16) | `bodyLarge` (16) | — |
| `bodyMedium` (14) | `bodyMedium` (14) | `bodySmallMedium` (14) | `bodyMedium` (14) | — |
| `bodySmall` (12) | `bodySmall` (12) | `captionSmallMedium` (12) | `bodySmall` (12) | — |
| `labelLarge` (14) | `labelLarge` (17) | `labelLarge` (16) | `labelLarge` (15) | — |
| `labelMedium` (12) | `labelMedium` (15) | `labelMedium` (14) | `labelMedium` (13) | — |
| `labelSmall` (11) | `labelSmall` (12) | `labelSmall` (12) | `labelSmall` (11) | — |
| `labelXSmall` (10) | `labelXSmall` (10) | — | — | Visor extension; SoleSpark only |

### Font families

| Repo | Family | Notes |
|---|---|---|
| SoleSpark | Outfit | Single family across all styles |
| ENTR | Outfit (body/title/label) + ModernSociety (display only) | Two families — display uses ModernSociety light |
| Veronica | PitchSans | Single family |
| Visor | Theme-supplied | Each Visor theme ships its own font family — do not reference source fonts |

**Translation rule:** font family is a brand decision, not a token to migrate. Consumers map their own font family in their `.visor.yaml` theme override.

### Font weights

ENTR and Veronica both ship a `UIFontWeight` class (`thin/extraLight/light/regular/medium/semiBold/bold/extraBold/black` mapping to `w100`–`w900`). SoleSpark uses raw `FontWeight.w300/400/500/600` inline. Visor does not surface a font-weight scale — text styles ship a single weight per slot, and overrides are inline:

```dart
context.visorTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w600)
```

For ENTR's heading-weight variants (`heading1Light` vs `heading1ExtraLight` vs `heading1Regular`), pick the closest Visor slot and override `fontWeight`. There is no Visor weight scale or `visorFontWeights` extension.

---

## Radius

Visor's radius scale is small. SoleSpark and Veronica ship rich scales; ENTR has no radius constants — values are inline in `ui_theme.dart`.

| Visor (`context.visorRadius`) | SoleSpark (`UIBorderRadius`) | ENTR (inline in `ui_theme.dart`) | Veronica (`UIBorderRadius`) | Notes |
|---|---|---|---|---|
| `sm` (4–6) | `xxs` (4) / `xs` (6) | (e.g., FilledButton `8`) | `xs` (4) | Compact chips, badges |
| `md` (8) | `sm` (8) | FilledButton, OutlinedButton, PopupMenu (`8`); ElevatedButton (`10`) | `sm` (8) | Most elements |
| `lg` (12–16) | `md` (12) / `lg` (16) | Card (`12`), Drawer / Dialog / DropdownMenu / InputDecoration (`16`) | `md` (12) / `lg` (16) | Cards, dialogs |
| `xl` (20–24) | `xlg` (20) / `xxlg` (24) | DatePicker / TimePicker (`24`) | `xxlg` (20) | Large modals |
| `pill` (9999) | `pill` (100) / `circle` (9999) | — | `pill` (44) | Fully rounded |

**Directional radius (`topLg`, `topXlg`, `bottomLg`, `leftLg`, `rightLg`):**

SoleSpark and Veronica ship directional helpers for bottom sheets and side panels. Visor has no directional helpers — compose `BorderRadius.only` from the scalar token:

```dart
// SoleSpark: UIBorderRadius.topLg (top corners, 16pt)
final r = context.visorRadius.lg;
BorderRadius.only(topLeft: Radius.circular(r), topRight: Radius.circular(r))
```

This is a known idiom but not a gap — it's Flutter's standard composition pattern.

---

## Shadows

| Visor (`context.visorShadows`) | SoleSpark (`UIShadows`) | ENTR | Veronica (`UIShadows`) | Notes |
|---|---|---|---|---|
| `xs` | `small` | (Material default) | `small` | Hover lift |
| `sm` | `smallLayered` (two-layer) | — | (use `small`) | Card lift |
| `md` | `medium` / `mediumLayered` | (Drawer `elevation: 1`) | `medium` | Cards, modals |
| `lg` | `large` / `largeLayered` | — | `large` | Floating panels |
| `xl` | `xlarge` | — | `xlarge` | Dialogs, tooltips |

**Visor shadows are already multi-layer** — they correspond to SoleSpark's `*Layered` variants by construction. Use whichever Visor step matches the source's intended elevation; layering is a Visor implementation detail.

**Special-effect shadows (non-portable):**

- SoleSpark `glow` (primary-color glow) — brand effect; replicate inline with `BoxShadow(color: theme.brandColor.withValues(alpha: 0.5), blurRadius: 16, spreadRadius: 2)` if needed
- SoleSpark `innerSoft` (inner pressed shadow) — pressed-state effect; not a Visor token, build inline
- Veronica `glowHalo`, `activeGlow` (warm gold halos using `goldenHour6pm*`) — brand-specific; consumer ships in own theme

---

## Stroke widths

| Visor (`context.visorStrokeWidths`) | Default value | Common source-repo literal | Use case |
|---|---|---|---|
| `thin` | 1px | `width: 1` (dividers, hairline borders) | Hairline borders, dividers |
| `regular` | 1.5px | (rare in source repos) | Default emphasized borders |
| `medium` | 2px | `width: 2` (focus rings, button progress) | Focus rings, button progress indicators |
| `thick` | 2.5px | `width: 2.5` (Veronica spinner: `4`) | Large spinners, prominent outlines |

**Canonical translation:** any literal stroke value in source code (`width: 1`, `strokeWidth: 2`, `thickness: 2.5`) maps to a `context.visorStrokeWidths.{slot}` lookup. Pick the slot whose default value matches the literal; if a source repo uses `4`, choose `thick` and let the consuming theme override `strokeWidths.thick: 4` in its `.visor.yaml` rather than introducing a fifth slot.

```dart
// Before — any source repo
Border.all(color: someColor, width: 1)
CircularProgressIndicator(strokeWidth: 2)
Container(height: 1, color: divider)

// After — Visor
Border.all(
  color: someColor,
  width: context.visorStrokeWidths.thin,
)
CircularProgressIndicator(
  strokeWidth: context.visorStrokeWidths.medium,
)
Container(
  height: context.visorStrokeWidths.thin,
  color: context.visorColors.borderMuted,
)
```

---

## Motion

| Visor (`context.visorMotion`) | SoleSpark (`UIDurations`) | ENTR | Veronica (`UIDurations`) | Notes |
|---|---|---|---|---|
| `durationFast` (~150ms) | `fast` (150) / `quick` (200) | (Material defaults) | `fast` (150) / `quick` (200) | Hover, micro-interactions |
| `durationNormal` (~300ms) | `medium` (250) / `smooth` (300) / `pageTransition` (300) | (Material defaults; ZoomPageTransitions) | `medium` (250) / `smooth` (300) | Default state changes |
| `durationSlow` (~500ms) | `slow` (400) / `slower` (500) / `modalPresentation` (400) | — | `slow` (400) / `slowest` (800) | Page changes, reveals |
| `easing` (`Curves.easeInOut`) | (Flutter `Curves.*` directly) | TabIndicatorAnimation `elastic` | (Flutter `Curves.*` directly) | Default easing |

**Source-only durations with no Visor equivalent (use literal Duration or pick closest Visor step):**

- SoleSpark `instant` (100), `loadingDelay` (300), `debounce` (300), `tooltipDelay` (500), `longPress` (1000), `bottomSheet` (250)
- Veronica `loading` (1200), `slowest` (800), `typingFast/Medium/Default/Slow` (10/20/30/80)

The typewriter durations and long debounces are application concerns — keep as `Duration(milliseconds: N)` literals at call sites; not worth a Visor token surface.

**Curves:** Visor ships only `easing` (default `Curves.easeInOut`). For specialized curves, use Flutter's built-ins directly (`Curves.easeOut`, `Curves.elasticOut`, etc.) — not a gap.

---

## Icons

Icons are not tokens. Mapping for completeness:

| Source | Pattern | Visor mapping |
|---|---|---|
| **SoleSpark** | Material `Icons.*` directly | Same — Visor uses Phosphor (`@phosphor-icons/react` web, `phosphor_flutter` mobile) for component icons; consumer code can keep Material |
| **ENTR** | Material `Icons.*` directly | Same — keep Material at consumer call sites; Visor widgets internally use Phosphor |
| **Veronica** | `UIIcons.*` (66 Phosphor wrappers) | Use `phosphor_flutter` icons directly: `UIIcons.heart` → `PhosphorIconsRegular.heart` |

Visor does not surface a `context.visorIcons` extension. Consumer code chooses its own icon library; Visor widgets that render icons accept `IconData` props.

---

## Before / after code examples

Five concrete patterns that account for the bulk of mass-rewrite work.

### 1. Button background color

```dart
// Before — SoleSpark
Container(color: UIColors.accentPrimary, ...)

// Before — ENTR (axis A)
Container(color: UIColors.primary, ...)

// Before — ENTR (axis B)
Container(color: Theme.of(context).colorScheme.primary, ...)

// Before — Veronica
Container(color: context.colorway.button.primary, ...)

// After — Visor
Container(color: context.visorColors.interactivePrimaryBg, ...)
```

### 2. Symmetric padding

```dart
// Before — SoleSpark
Padding(padding: UIEdgeInsets.allmd, child: ...)

// Before — ENTR
Padding(padding: const EdgeInsets.all(UISpacing.md), child: ...)

// Before — Veronica
Padding(padding: UIEdgeInsets.allmd, child: ...)

// After — Visor
Padding(padding: EdgeInsets.all(context.visorSpacing.md), child: ...)
```

### 3. Body text style

```dart
// Before — SoleSpark / ENTR / Veronica (all three)
Text('Hello', style: UITextStyles.bodyLarge)

// Before — ENTR (Material textTheme path)
Text('Hello', style: Theme.of(context).textTheme.bodyLarge)

// After — Visor
Text('Hello', style: context.visorTextStyles.bodyLarge)
```

### 4. Focus ring border

```dart
// Before — SoleSpark
Border.all(color: UIColors.accentPrimary, width: 2)

// Before — ENTR (axis A)
Border.all(color: UIColors.primary, width: 2)

// Before — Veronica
Border.all(color: context.colorway.border.focus, width: 2)

// After — Visor
Border.all(
  color: context.visorColors.borderFocus,
  width: context.visorStrokeWidths.medium,
)
```

### 5. Divider

```dart
// Before — SoleSpark
Container(height: 1, color: UIColors.outline)

// Before — ENTR
Container(height: 1, color: Theme.of(context).colorScheme.outline)

// Before — Veronica
Container(height: 1, color: context.colorway.border.defaultColor)

// After — Visor
Container(height: 1, color: context.visorColors.borderDefault)
```

---

## Token gaps

Gaps surfaced during the Rosetta Stone audit. Each row links to a follow-up ticket.

| Gap | Description | Ticket | Status |
|---|---|---|---|
| `surfaceSelected` | Persistent selected-row surface (used by `visor_settings_tile`, future sidebar nav) | [VI-242](https://linear.app/low-orbit-studio/issue/VI-242) | Todo |
| Stroke-width tokens | Border / outline / spinner-stroke widths surfaced as `context.visorStrokeWidths.{thin,regular,medium,thick}` (4-slot semantic scale, themable per `.visor.yaml`) | [VI-244](https://linear.app/low-orbit-studio/issue/VI-244) | Done |
| Opacity scale | 8-slot scale `context.visorOpacity.alpha{5,10,12,20,40,50,60,80}` + CSS `--opacity-*`; canonical translation pattern in [Opacity variants](#opacity-variants) above | [VI-245](https://linear.app/low-orbit-studio/issue/VI-245) | Done |

### Gaps that don't need tickets

- **Brand-specific colors** (`UIPrimaryColors.goldenHour*`, `UIColors.sellerPrimary`, `BgColors.warmth1–6`) — consumer-locked. Override at theme layer in the consumer's `.visor.yaml`, not at the Visor widget layer.
- **Special-effect shadows** (`glow`, `glowHalo`, `activeGlow`, `innerSoft`) — brand-specific. Build inline in consumer code.
- **Directional radius helpers** (`topLg`, `bottomLg`, `leftLg`, `rightLg`) — standard Flutter composition pattern. Use `BorderRadius.only(...)` with Visor's scalar tokens.
- **Typewriter / loading durations** (`typingFast/Medium/Default/Slow`, `loading: 1200`) — application concerns, keep as literals.
- **Animation curves** beyond `easing` — use Flutter's built-in `Curves.*` directly.
- **Heading weight variants** (ENTR's `heading{1..6}{Light,Regular,Medium,SemiBold,Bold,ExtraBold}`) — Visor text styles ship a single weight per slot; override inline with `.copyWith(fontWeight: ...)`.

---

## See also

- [`docs/MIGRATION.md`](../MIGRATION.md) — top-level migration guide (shadcn/ui, kaiah-app)
- [`docs/flutter-widget-candidates.md`](../flutter-widget-candidates.md) — Flutter widget port candidate inventory
- [`docs/component-inventory.md`](../component-inventory.md) — current vs. target Visor component coverage
- [`docs/token-rules.md`](../token-rules.md) — Visor token rules and theme contract
- [`docs/roadmap.md`](../roadmap.md) — Phase 1b Flutter widget porting context
