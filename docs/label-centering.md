# Label centering

Every fixed-height, single-line control centres its label's **capitals**, not its line box. Shared by Button (VI-682) and toggle-group, tabs, chip, badge, select and input (VI-684). Each copy-and-own component carries the CSS; they share this one spec and one test helper (`components/ui/__tests__/ink-centering.ts`, `scripts/measure-ink-centering.ts`).

## Why

A flex container centres the label's line box, whose height comes from the font's ascent and descent, not from where its capitals sit. The capitals land high or low by an amount that differs per font (Product Sans ran ~1px high in a 40px button).

## The pattern

1. **Wrap bare text** (strings and numbers; leave icons and elements alone) in `<span class="label" data-slot="<component>-text">`. The wrapper is a block.
2. **Trim its line box** to the capital-to-baseline band: `text-box: trim-both cap alphabetic`, inside `@supports (text-box: trim-both cap alphabetic)`. Without support (Firefox) the span is a plain block and rendering is what it was.
3. **Keep the box.** A control with a fixed `height` needs nothing. A control whose height is intrinsic (badge, select trigger, line tabs) gets `padding-block: calc((1lh - 1cap) / 2)` on the label, which hands back exactly the room the trim took. The same padding keeps descenders visible under `overflow: hidden` (chip, tabs).
4. **Blink baseline snap (Blink only).** Blink snaps the baseline to a whole CSS px, leaving the trimmed ink up to half a px off. Set `--label-box-height` on the control to its outer height (equal to `height`, or the sum of padding, border and `1lh` when intrinsic) and give the label

   ```css
   transform: translateY(calc((var(--label-box-height) + 1cap) / 2 - round((var(--label-box-height) + 1cap) / 2, 1px)));
   ```

   inside `@supports (text-box: trim-both cap alphabetic) and (not (-apple-pay-button-style: black))`. WebKit places the baseline exactly, so correcting there overshoots; `-apple-pay-button-style` is the WebKit-only probe. If `--label-box-height` is unset the transform is invalid and resolves to `none`.
5. **Do not re-declare `font` or `font-family`** on the control (VI-616).

If a theme re-binds a control's padding or height (`--badge-md-padding`, `--tabs-list-height`), re-bind `--label-box-height` with it, or the Blink correction is computed for the default box.

## Native `<input>`

An input has no label span to wrap or transform. Chromium trims its inner line box with `text-box: trim-both cap alphabetic` on the input itself, which centres the typed value and the placeholder, with no change to its box. The inner line box is placed on whole CSS px in Chromium, so an odd box height (md is 51px) can leave the capitals up to 0.5px off; WebKit does not trim an `<input>` yet (Arial sits ~0.34px high). Both are held to 0.5px in the tests; every other control is held to 0.25px.

## Measuring

`npx tsx scripts/measure-ink-centering.ts controls` prints the offset (CSS px, positive = low) of every control and size in Arial, Product Sans and PP Model Mono (`INK_BROWSER=webkit`, `INK_DSF=2|4`). `npx tsx scripts/ink-zoom.ts <dir>` writes zoomed sheets with a centre guide. The harness places every control on an integer y, because the baseline snap depends on the control's fractional position, and scans the label's own horizontal extent (so a select's caret is not read as ink) clear of the corner curve.

Tests: `components/ui/__tests__/button-ink-centering.test.ts`, `control-ink-centering.test.ts`.
