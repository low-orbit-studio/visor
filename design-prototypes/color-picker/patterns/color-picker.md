# ColorPicker — Design Recipe

> Canonical pattern recipe for the first-class Visor `ColorPicker` primitive.
> Locked design direction. Implementation reuses the OKLCH engine from
> `@loworbitstudio/visor-theme-engine` (already validated by the docs theme creator).

## 1. Purpose

A production-grade color picker that any Visor consumer can install via
`npx visor add color-picker`. It is the picker behind:

- Per-EPK brand customization in Blacklight
- Theme-creator workflows in any project
- The future fancy brand-picker in the `prototype-review` block
- `/lo-design-pattern` color exploration use cases

The reference internal engine lives at
`packages/docs/app/create/components/oklch-picker.tsx`. The math (OKLCH ↔ hex,
sRGB clamp, gamut detection) is already correct and exported from
`@loworbitstudio/visor-theme-engine`. The new primitive reuses that math
directly — no re-derivation.

## 2. Anatomy

```
ColorPicker (root, role="group")
├─ trigger (button | "inline" | "headless")
│  ├─ swatch chip — current color preview
│  └─ hex label (optional, hidden via `compact`)
├─ surface (popover content)
│  ├─ plane — 2D lightness × chroma canvas
│  │   └─ crosshair indicator at current (L, C)
│  ├─ hue track — horizontal hue gradient (0..360°)
│  │   └─ hue thumb at current H
│  ├─ readout — L, C, H + hex (compact label row)
│  ├─ hex input — 6-digit hex text field with auto-`#` prefix
│  └─ swatch row — optional preset chips (recent / palette / brand)
```

The popover wrapping is **optional**. The component renders the picker
inline when `mode="inline"` and renders a Radix Popover with the trigger
swatch when `mode="popover"` (default).

## 3. Variants & Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `value` | `string` | — | Controlled hex value (e.g. `#3b82f6`). |
| `defaultValue` | `string` | `#3b82f6` | Uncontrolled initial value. |
| `onChange` | `(hex: string) => void` | — | Fired on every continuous interaction. |
| `onCommit` | `(hex: string) => void` | — | Fired on pointer-up / popover-close — for debounced consumers. |
| `mode` | `"popover" \| "inline"` | `"popover"` | Render in a Radix Popover or inline. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Affects trigger swatch size + plane height. |
| `showHex` | `boolean` | `true` | Hide the hex input row (advanced consumers). |
| `showReadout` | `boolean` | `true` | Hide the L/C/H readout row. |
| `presets` | `string[]` | — | Optional hex preset chips. Each chip is keyboard-focusable. |
| `aria-label` | `string` | `"Color picker"` | Required for screen readers. |
| `disabled` | `boolean` | `false` | Disables interaction; trigger gets `aria-disabled`. |
| `name` | `string` | — | Forwarded to a hidden `<input type="hidden">` for form submission. |
| `className` | `string` | — | Forwarded to root. |

Returned hex is always lowercase, 6 digits, prefixed with `#`.

## 4. Visual Surface — Locked Direction

### Plane (lightness × chroma)

- Aspect ratio: `1.4` (matches reference engine — preserves UX recognition)
- Background: full-bleed pixel canvas painted via `clampToSrgb(L, C, H)` per pixel
- Out-of-gamut pixels: dimmed grey-blend (40% color + 60% neutral grey)
  — matches the reference engine and signals "outside sRGB" without
  scaring the user
- Border: `var(--stroke-width-thin) solid var(--border-default)`
- Radius: `var(--radius-sm)`
- Cursor: `crosshair`
- Crosshair indicator: 12px outer ring, white stroke, neutral inner shadow
  — sized in pixels for precise pointing accuracy (deviates from spacing
  scale on purpose, documented as intentional under Rule 12)

### Hue track

- Height: `var(--spacing-4)` (1rem)
- Background: full-bleed pixel canvas painted across 0..360° at fixed
  preview L (0.7) / C (0.15)
- Border: `var(--stroke-width-thin) solid var(--border-default)`
- Radius: `var(--radius-sm)`
- Hue indicator: 4px-wide vertical bar, white with neutral outline
- Cursor: `crosshair`

### Readout

- Three inline labels at `var(--font-size-xs)`, color `var(--text-tertiary)`
- Format: `Hue: 240°` · `L: 0.55` · `C: 0.150`

### Hex input

- Reuses `<Input size="sm">` from `components/ui/input`
- Monospace via `font-feature-settings: "tnum"` on the local class
- Auto-prepend `#` if user types raw hex digits
- `aria-invalid="true"` on parse failure; reverts on blur

### Preset chips (optional)

- Row of 24px square chips below the hex input
- Each is a keyboard-focusable `<button>` with `aria-label="Use color #abc123"`
- Focused chip gets the standard `--border-focus` ring via `--focus-ring-width`

### Popover trigger swatch

- Sizes: `sm` 24×24, `md` 32×32, `lg` 40×40
- Border: `var(--stroke-width-thin) solid var(--border-default)`
- Radius: `var(--radius-sm)`
- Focus ring: `var(--focus-ring-width) solid var(--border-focus)` via
  `color-mix()` (matches existing input focus pattern)
- Disabled: standard 0.5 opacity via existing `opacity-40` token

### Surface (popover content)

- Background: `var(--surface-popover)` falling back to `var(--surface-card)`
- Border: `var(--stroke-width-thin) solid var(--border-default)`
- Shadow: `var(--shadow-md)`
- Padding: `var(--spacing-4)`
- Gap between sections: `var(--spacing-3)`
- Min width: 16rem (matches the reference picker; keeps the plane
  readable at small viewports)

## 5. Token & Rule Compliance

| Rule | How this component complies |
|---|---|
| 1. Gray fallbacks | All `var()` fallbacks use Tailwind Gray (`#e5e7eb`, `#9ca3af`, …) |
| 2. Shadows | `var(--shadow-md)` for popover surface; no inline `rgba()` shadows |
| 3. Strokes | All borders use `var(--stroke-width-thin)`; never bare `1px` |
| 4. Opacity | Disabled state uses `opacity: var(--opacity-40)` |
| 5. Spacing | All padding/gap on `var(--spacing-N)`; canvas dimensions documented as intentional |
| 6. Motion | Trigger transitions use `var(--motion-duration-150)` + `var(--motion-easing-default)` |
| 7. Focus ring | `var(--focus-ring-width)` + `color-mix()` on `--border-focus` |
| 8. Overlay | N/A — no full-screen scrim; popover is inline-positioned |
| 9–11. Themes / fonts | No new theme tokens introduced |
| 12. No magic numbers | Crosshair (12px) + canvas-max (200px) documented as intentional pixel values for pointing precision and performance |

## 6. Interaction Behavior

- **Pointer-down on plane** → start drag; pointer capture; update `(L, C)`
  via `requestAnimationFrame` per move; fire `onChange` with new hex.
- **Pointer-up on plane** → release; fire `onCommit` with final hex.
- **Pointer-down on hue track** → same pattern for `H`.
- **Keyboard on plane**: Arrow keys nudge L/C by 0.01; Shift+Arrow nudges
  by 0.05; PgUp/PgDn jump by 0.1.
- **Keyboard on hue track**: Arrow keys nudge H by 1°; Shift+Arrow by 15°;
  Home/End jump to 0°/360°.
- **Hex input**: parse on every change; commit valid hex; revert invalid
  on blur.
- **Popover close**: `Escape` closes; clicking outside closes; trigger
  toggle re-opens. On close, fire `onCommit`.
- **Disabled**: all pointers/keys are no-ops; visually 0.4 opacity.

## 7. Accessibility

- Root is `role="group"` with `aria-label`.
- Plane is `role="slider"` with `aria-valuetext` describing L/C.
- Hue track is `role="slider"` with `aria-valuemin=0`, `aria-valuemax=360`,
  `aria-valuenow`.
- Hex input is a labeled `<input type="text">` with `aria-invalid` on
  parse failure.
- Trigger swatch is a `<button>` with `aria-expanded`, `aria-haspopup="dialog"`,
  and `aria-label="Pick {value} color"`.
- Color contrast: the readout text uses `--text-tertiary` against
  `--surface-popover` — both theme-defined and WCAG-compliant by design.
- Reduced-motion: `prefers-reduced-motion: reduce` disables the
  crosshair-position transition (instant jump instead of animated tween).

## 8. Themeability

- Zero hex literals in CSS. Every visible surface, border, shadow, focus
  ring, and text color references a semantic token.
- Plane and hue canvas pixels are computed colors — they're *outputs* of
  the picker, not theme surfaces. They reference no theme tokens.
- Works under any registered theme out of the box.

## 9. Followup Gaps (recorded, not filed)

The following inventory is captured here for downstream tickets — do
**not** open new Linear issues during this swarm. Open them post-merge.

| Gap | Notes |
|---|---|
| `eyedropper` API integration | Where supported (`window.EyeDropper`), expose an eyedropper icon button in the popover header. Progressive enhancement. |
| Alpha channel | This recipe is opaque-color only. Alpha support is a separate ticket (rgba support, 4-digit/8-digit hex). |
| Color harmony helpers | Triadic / complementary / analogous swatch suggestions below the picker. |
| OKLCH input mode | Direct L/C/H entry alongside hex. Useful for theme authors but not required for v1. |
| `prototype-review` block integration | Wire ColorPicker into the block as an opt-in upgrade from the simple hex picker. New PR. |
| Flutter port | Two-Layer (Phase 10a) widget version once the design is validated in React. |

## 10. Files

```
components/ui/color-picker/
├── color-picker.tsx           # The component
├── color-picker.module.css    # The styles
├── color-picker.module.css.d.ts  # CSS module type def (hand-written, matches existing pattern)
├── color-picker.visor.yaml    # Metadata
├── oklch.ts                   # Pure OKLCH math wrappers (re-exports + helpers)
└── __tests__/
    └── color-picker.test.tsx  # Vitest + RTL + axe
```

Registry entry: appended to `registry/registry-ui.ts` (form category section).
Docs page: `packages/docs/content/docs/components/form/color-picker.mdx`,
with the form `meta.json` updated to alphabetize.

## 11. Verification

- `npm run typecheck` passes.
- `npm test` passes; new tests cover: render, controlled/uncontrolled,
  popover open/close, hex parsing, plane keyboard, hue keyboard,
  disabled, and axe WCAG-AA.
- `npx visor list --category form` shows `color-picker`.
- Docs page renders via fumadocs with three live examples (default,
  inline mode, with presets).
