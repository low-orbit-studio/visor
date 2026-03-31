# Extraction Report: Reference NextJS App

**Source:** `~/Code/low-orbit/low-orbit-playbook/reference-nextjs-app/`
**Difficulty:** Hard (custom naming conventions)

## Extraction Summary

| Metric | Value |
|--------|-------|
| CSS files scanned | 1 (globals.css) |
| Total tokens extracted | 1 |
| High confidence | 0 |
| Medium confidence | 1 |
| Low confidence | 0 |
| Unmapped tokens | 13 |

## Color Role Accuracy

| Role | Extracted | Actual | Correct? |
|------|-----------|--------|----------|
| Primary | `#6366f1` (default) | `#1A5F7A` (tide-mid) | No — extractor couldn't identify primary |
| Accent | Not found | `#5BC4BF` (surf) | No |
| Warning | `#FFB217` | `#FFB217` | Yes |
| Neutral | Not found | `#6B7280` (graphite-derived) | No |

**Primary color missed:** The Reference App uses a custom palette naming convention (`--tide-deep`, `--tide-mid`, `--surf`, `--coral`) that doesn't match any standard pattern (primary/accent/brand). The extractor correctly flagged this: "Could not identify a primary color."

## Typography Accuracy

No font packages detected in `package.json`. The Reference App uses Satoshi loaded via `@font-face` in CSS, which the extractor doesn't currently parse. Manual intervention was needed to set the font family.

## What Worked

- Warning color (`#FFB217`) correctly identified via naming convention match
- CSS file discovery found `globals.css` correctly
- Unmapped token list accurately captured all custom properties

## What Needed AI Help

- Primary color: manually identified `--tide-mid` (`#1A5F7A`) as the primary brand color from the Tide palette
- Accent color: manually identified `--surf` (`#5BC4BF`) as the secondary/accent color
- Background: manually set `#F5F5F0` (cream) from `--bg-cream`
- Typography: manually set Satoshi (detected from CSS `@font-face`, not from npm)
- Dark mode: entirely manual — the source has no dark mode, so dark colors were inferred

## What Failed / Limitations

1. **Custom naming conventions** — The Reference App's Tide/Surf/Coral palette is fully custom. No standard naming patterns match.
2. **`@font-face` parsing** — The extractor only looks at `package.json` for font detection, missing CSS-declared fonts.
3. **No dark mode detection** — Source project has no `.dark` or `[data-theme="dark"]` selectors.
4. **`var()` references in shadows** — Source shadows use `rgba(var(--graphite-rgb), 0.08)` which the extractor captures literally. Manual replacement with resolved values was needed.
5. **RGB channel tokens** — `--tide-deep-rgb`, `--graphite-rgb` etc. are used for alpha compositing but aren't extractable as colors.

## Recommendations for Extractor Improvements

- Parse `@font-face` declarations for font family detection
- Add heuristic: if a project has no standard primary/accent naming, try to infer from usage frequency (most-referenced color = likely primary)
- Resolve `var()` references in shadow values when the referenced variable is in the same file
