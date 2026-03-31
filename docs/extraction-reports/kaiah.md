# Extraction Report: Kaiah

**Source:** `~/Code/kaiah/kaiah-app/packages/ui/`
**Difficulty:** Hard (OKLCH colors, @custom-variant, shadcn/ui naming)

## Extraction Summary

| Metric | Value |
|--------|-------|
| CSS files scanned | 1 (src/globals.css) |
| Total tokens extracted | 18 |
| High confidence | 0 |
| Medium confidence | 18 |
| Low confidence | 0 |
| Unmapped tokens | 41 |

## Color Role Accuracy

| Role | Extracted | Actual | Correct? |
|------|-----------|--------|----------|
| Primary | `oklch(0.214 0.009 43.1)` | Warm dark brown | Partially — correct token, needs hex conversion |
| Accent | `oklch(0.96 0.002 17.2)` | Light warm beige | Partially — correct token, needs hex conversion |
| Error | `oklch(0.577 0.245 27.325)` | Red (destructive) | Yes — mapped from `--destructive` |

**OKLCH preserved:** The extractor correctly preserved OKLCH values as-is rather than converting them. For the `.visor.yaml`, manual conversion to hex was needed since the theme engine's shade generator works best with hex input.

**Dark mode detected:** The extractor correctly identified light/dark context from `@custom-variant dark` or from the `.dark` class prefix in Kaiah's CSS. Dark mode overrides were captured with different OKLCH values.

## Typography Accuracy

| Role | Extracted | Actual | Correct? |
|------|-----------|--------|----------|
| Body | `var(--font-sans)` | Inter (via next/font) | No — captured CSS variable reference, not resolved value |

**Unresolved variable reference:** The CSS declares `font-family: var(--font-sans)` which the extractor captures literally. The actual font (Inter) is set via `next/font` in the layout, not in the CSS.

## What Worked

- OKLCH values correctly preserved in extraction
- Dark mode split correctly detected (separate sections for light and dark)
- `--primary`, `--accent`, `--destructive` patterns all matched
- `--sidebar-primary`, `--sidebar-accent` correctly mapped as duplicates of main roles
- File discovery found `src/globals.css` correctly

## What Needed AI Help

- OKLCH to hex conversion: manually converted `oklch(0.214 0.009 43.1)` → `#3B2F1A` etc.
- Typography: manually identified Inter from next/font configuration
- Background/surface: manually extracted from `--background` and `--card` unmapped tokens
- Status colors: only destructive/error was auto-detected; success/warning/info were set to defaults

## What Failed / Limitations

1. **shadcn/ui naming unmapped** — Tokens like `--background`, `--foreground`, `--card`, `--popover`, `--muted`, `--secondary`, `--ring`, `--input` don't match Visor's semantic patterns. These are shadcn/ui conventions.
2. **OKLCH shade generation** — The theme engine's shade generator expects hex input. OKLCH values needed manual conversion.
3. **`var()` font references** — CSS custom property references for fonts are captured literally instead of being resolved.
4. **Chart colors unmapped** — `--chart-1` through `--chart-5` are data visualization colors not in Visor's model.
5. **Sidebar tokens unmapped** — `--sidebar`, `--sidebar-foreground`, `--sidebar-border`, `--sidebar-ring` are component-scoped tokens.
6. **No status colors except destructive** — Kaiah only defines `--destructive`; no explicit success/warning/info tokens exist in the CSS.

## Recommendations for Extractor Improvements

- Add shadcn/ui naming convention support: map `--background` → surface.background, `--card` → surface.card, `--foreground` → text.primary, `--muted` → neutral, etc.
- Add OKLCH → hex conversion option for better shade generation compatibility
- Resolve `var()` font references by checking layout files or next.config for font configuration
- Detect `@custom-variant dark` as a dark mode indicator (appears to be working based on results)
