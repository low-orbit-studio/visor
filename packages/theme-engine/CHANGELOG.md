# Changelog

## 0.5.0

### Minor Changes

- e61b904: VI-352 — Add per-family weight-name alias registry for visor-fonts CDN URL builder.

  Foundries like Pangram Pangram ship non-standard PostScript names (e.g. `Book` for the regular weight, `Super` for the heaviest). The new `font-aliases.ts` module maps `family → weight → PostScript suffix`; `buildVisorFontUrl()` consults the registry before falling back to the standard `WEIGHT_NAMES` table. Seeded with PP Model Mono and PP Model Plastic (`400 → Book`, `800 → Super`).

  No behavior change for any family not listed in the registry — Google-Fonts-style PostScript names continue to resolve through the existing table.

## 0.4.2

### Patch Changes

- c621d04: Fix neutral-ramp lightness interpolation: replaced the `-1` placeholder in `LIGHTNESS_TARGETS[500]` with `0.55` (Tailwind gray-500's OKLCH L) so `computeLightness()` produces well-distributed ramps for any input neutral, not just inputs that coincidentally land near L≈0.55. Removes dead `anchorShade === 600` branches (every role anchors at 500). Affects auto-derived `neutral.50–neutral.950` shades for themes that don't override neutrals explicitly; neutral.200–500 now land in proper gray territory instead of being pushed toward near-white.
- 8f444af: Rebalance `SEMANTIC_TEXT_MAP` so the auto-derived text scale clears WCAG AA contrast by default for any reasonable input neutral. `text-secondary` now maps to neutral 700/300 (light/dark) and `text-tertiary` to neutral 600/400 — both fixed-L shades. Previously `text-tertiary` landed on neutral 400 (L 0.65), giving ~3.5:1 contrast on white and forcing every stock theme to override the entire text scale. `text-primary` (900/50) and `text-disabled` (300/600) are unchanged. Stock themes (`neutral`) drop their defensive text overrides; `modern-minimal`, `blackout`, and `space` keep theirs as intentional brand language. Borderless dark text-secondary contrast improves from 2.96:1 to 6.77:1.
- 1b5c01a: Expand the runtime contrast validator (`checkContrastWarnings` in `validate.ts`) to check WCAG AA contrast for all standard text levels (`text-primary`, `text-secondary`, `text-tertiary`) and status text levels (`text-error`, `text-warning`, `text-success`, `text-info`) against `bg` and `surface` in both light and dark modes. Coverage expanded from 4 checks to 28 per theme. The validator now drives token values through the same semantic pipeline consumers render (`generatePrimitives` + `assignSemanticTokens` + `applyOverrides`), so theme-specific neutrals and overrides are respected instead of hardcoded `#111827` / `#f9fafb` proxies. `text-disabled` remains exempt per WCAG 1.4.3 Note; `text-link`, `text-link-hover`, `text-inverse`, `text-inverse-secondary` are out of scope (rendered on contextual / inverted surfaces). Theme authors iterating on `.visor.yaml` will now catch tertiary/secondary/status text contrast failures during validation instead of in production.

## 0.4.1

### Patch Changes

- 33f4853: Republish to include `flutterAdapter` export. The 0.4.0 tarball was stale — the local source had added `flutterAdapter` to `adapters/index.ts` but the published artifact did not include it, breaking `@loworbitstudio/visor@0.5.0` (which depends on `^0.4.0`) at import time.

## [Unreleased]

## [0.3.0] - Initial release

### Added

- Initial release of the Visor theme engine for building and distributing design system themes.

## 0.1.0 — Initial Release

### Themes

- **ENTR theme** — First extracted production theme from client project (VI-115)
- **Stock vs custom theme separation** — `themes/` directory split into stock (shipped) and custom (gitignored, consumer-owned) (VI-148)
- **Docs adapter** — `docsAdapter` for registering themes in the fumadocs site (VI-121)
- **Dark-first color scale** — Brand anchor at 500; dark/light scale generated separately to avoid wash-out (VI-152 + subsequent)
- **Label, group, and default-mode fields** — Theme metadata extended for registry and UI display

### Typography

- **Display font slot** — `.visor.yaml` typography section supports a dedicated display font separate from body (VI-118)
- **Font scale adjust** — `size-adjust` on `@font-face` declarations for themes with non-1 typography scale

### Infrastructure

- **Validator hardening** — Dark/light parity warnings; hooks/patterns/registry rule enforcement (VI-152)
- **License & package metadata** — MIT license, keywords, homepage, repository fields (VI-111)
- **npm audit clean** — Resolved all audit vulnerabilities at time of release (VI-108)
- **Removed broken `./fonts` subpath** — Dropped non-functional subpath export that caused resolution errors in consumers (VI-145)
