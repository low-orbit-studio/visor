# ColorPicker — Design Handoff

> Manifest of design artifacts produced for VI-432. Implementation reads this
> alongside the locked recipe.

## Artifacts

| Artifact | Path |
|---|---|
| Pattern recipe (locked) | `design-prototypes/color-picker/patterns/color-picker.md` |
| HiFi mockup (HTML) | `.lo/prototypes/color-picker/index.html` |
| Reference engine | `packages/docs/app/create/components/oklch-picker.tsx` |
| Reusable math (npm) | `@loworbitstudio/visor-theme-engine` — `hexToOklch`, `oklchToHex`, `clampToSrgb`, `rgbToHex`, `isValidHex`, `normalizeHex` |

## Implementation Substitutions

| Recipe element | Visor primitive |
|---|---|
| Surface (popover) | Radix `Popover` (already in repo as `components/ui/popover`) |
| Hex input | `components/ui/input/Input` size="sm" |
| Trigger swatch | Plain `<button>` styled in `color-picker.module.css` (reusing focus-ring tokens) |
| Plane canvas | Native `<canvas>` (no Visor primitive needed) |
| Hue canvas | Native `<canvas>` (no Visor primitive needed) |
| Preset chip | Plain `<button>` styled in CSS module |

## Followup Gaps (post-merge)

- `EyeDropper` API integration where supported
- Alpha-channel support (`rgba` / 8-digit hex)
- Color-harmony helpers (triadic / complementary)
- OKLCH input mode (direct L/C/H entry)
- `prototype-review` block integration
- Flutter port (Phase 10a Two-Layer)

These are recorded here and in §9 of the recipe — they will be filed as
Linear tickets *after* this PR lands, per the swarm contract.
