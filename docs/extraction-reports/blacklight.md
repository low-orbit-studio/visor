# Extraction Report: Blacklight

**Source:** `~/Code/blacklight/packages/design-tokens/dist/`
**Difficulty:** Medium (flat primitives, naming convention matching)

## Extraction Summary

| Metric | Value |
|--------|-------|
| CSS files scanned | 1 (tokens.css in dist/) |
| Total tokens extracted | 32 |
| High confidence | 4 |
| Medium confidence | 28 |
| Low confidence | 0 |
| Unmapped tokens | 65 |

## Color Role Accuracy

| Role | Extracted | Actual | Correct? |
|------|-----------|--------|----------|
| Primary | `#F46C00` | `#F46C00` (orange) | Yes |
| Accent | `rgba(244, 108, 0, 0.25)` | `#00D4FF` (cyan) | No — picked border-accent-muted instead |
| Neutral | `rgba(255, 255, 255, 1)` | `#6B7280` | No — picked text-primary instead of gray |
| Success | `#10B981` | `#10B981` | Yes |
| Warning | `#F46C00` | `#F59E0B` | Wrong — picked orange instead of amber |
| Error | `#EF4444` | `#EF4444` | Yes |
| Info | `#3B82F6` | `#3B82F6` | Yes |
| Surface | `#12122A` | `#12122A` (midnight) | Yes |

**Accent misidentified:** The extractor matched `--border-accent-muted` (an rgba opacity variant) instead of `--accent-secondary` (`#00D4FF` cyan). The `accent` pattern matched the first candidate alphabetically.

**Warning/Primary conflated:** Both orange and amber map to the "warning" pattern. The extractor used the first match (`--color-orange`) which is actually the primary brand color.

## Typography Accuracy

| Role | Extracted | Actual | Correct? |
|------|-----------|--------|----------|
| Heading | `PP Model Plastic` | PP Model Plastic | Yes (but with trailing quote artifact) |
| Body | `PP Model Mono` | PP Model Mono | Yes (but with trailing quote artifact) |

**Font parsing issue:** The extractor captured `"PP Model Plastic", sans-serif"` — the CSS value includes the full `font-family` stack, and the quote parsing left a stray trailing `"`. Manual cleanup was needed.

## What Worked

- Primary color correctly identified from `--accent-primary` and `--border-focus` semantic tokens (high confidence)
- Status colors (success, error, info) all correctly mapped
- Surface/background colors extracted from `--surface-card` and `--surface-background`
- Shadow values captured correctly
- Motion durations captured

## What Needed AI Help

- Accent color: manually identified `#00D4FF` (cyan) from `--accent-secondary`
- Neutral color: manually set to `#6B7280` (gray)
- Warning vs primary: disambiguated `#F46C00` (primary) from `#F59E0B` (warning)
- Font family cleanup: removed stray quote characters
- Dark mode overrides: Blacklight is dark-only, so both light and dark overrides were set identically

## What Failed / Limitations

1. **Opacity variants unmapped** — 48 tokens like `--color-white-5` through `--color-white-80` and similar for orange, cyan, emerald. These are opacity scales that Visor's token model doesn't represent.
2. **No dark mode separation** — All tokens are in `:root` (dark-only app). Extractor correctly detected no `.dark` selector but defaulted to treating everything as "light" context.
3. **Tier/feature colors unmapped** — `--tier-free`, `--tier-starter`, `--tier-pro`, `--tier-business` are app-specific and don't map to any Visor token.
4. **`dist/` directory skipped by default** — Had to point extractor directly at `dist/` since the source tokens are built from JSON, not authored as CSS.
5. **WCAG contrast warnings** — Expected for a dark-only theme where "light mode" values are actually dark backgrounds with light text.

## Recommendations for Extractor Improvements

- Add heuristic for dark-only projects: if background is very dark and text is very light in :root, classify as dark mode
- Better accent disambiguation: prefer `--accent-secondary` or `--accent` over `--border-accent-*`
- Support opacity variant detection: group `--color-X-N` patterns and note the base color
- Clean up font-family stacks: strip trailing quotes and fallback families
