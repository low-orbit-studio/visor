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

**Do not trim a native `<input>`.** A native input clips its content to its inner line box, so `text-box: trim-both cap alphabetic` on it cuts everything below the baseline and above the cap height ("Typography jpq" rendered as "Tvpoaraphv ipa", VI-684). Input is left untrimmed and takes the font's own line box. Measured, capitals sit within 0.2px at sm and up to 0.9px high at md and lg in Chromium (the inner line box snaps to whole CSS px; md and lg heights are intrinsic), and within 0.34px in WebKit. The test bound is 1px in Chromium and 0.5px in WebKit. Clipping is never acceptable; a sub-pixel offset is.

## No clipping

Trimming shrinks the box that glyphs are clipped against. Any `overflow` other than `visible` on the trimmed element or an ancestor (chip and tabs labels for their ellipsis, Badge, Select) cuts descenders (g j p q y) and accents above the cap height (É Å Ñ). For an ellipsis label, widen the clip box without moving the layout box: extra `padding-block` cancelled by a negative `margin-block` (see `chip.module.css`). A short pill has no room for the accents and descenders of a line box that is exactly `1lh` tall, so Badge is `overflow: visible`. Test every trimmed control with `Typography jpq ÉÅÑ`, not just a cap-only label: `components/ui/__tests__/control-ink-clipping.test.ts` (helper `ink-clipping.ts`, report `npx tsx scripts/ink-clip-report.ts`).

## Measuring

`npx tsx scripts/measure-ink-centering.ts controls` prints the offset (CSS px, positive = low) of every control and size in Arial, Product Sans and PP Model Mono (`INK_BROWSER=webkit`, `INK_DSF=2|4`). `npx tsx scripts/ink-zoom.ts <dir>` writes zoomed sheets with a centre guide. The harness places every control on an integer y, because the baseline snap depends on the control's fractional position, and scans the label's own horizontal extent (so a select's caret is not read as ink) clear of the corner curve.

Tests: `components/ui/__tests__/button-ink-centering.test.ts`, `control-ink-centering.test.ts`, `control-ink-clipping.test.ts`.
