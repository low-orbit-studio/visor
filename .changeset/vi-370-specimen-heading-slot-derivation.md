---
"@loworbitstudio/visor": patch
---

VI-370 fix: derive Typography specimen "Heading & Body" card from the heading slot, not the body slot.

`deriveFontFamiliesFromTypography` in `blocks/design-system-specimen/specimen-data.ts` was reading `manifest.body` first when picking the slot that drives the `--font-heading` row. That precedence predates VI-355, when the docs adapter hard-aliased `--font-heading` to `var(--font-sans)`. VI-355 made the engine resolve `--font-heading` from the heading slot directly, but this derivation was never updated.

Net effect: the Typography card has been silently labeling the heading row with `body.family` and `body.weights` ever since — even though the actual rendered CSS was correct. Most visible on themes that pair a display-style heading family with a different body family (e.g. Blacklight's heading=PP Model Plastic / body=PP Model Mono showed "PP Model Mono" on the heading card).

Swap to heading-first (`heading ?? display ?? body`). Mono-row precedence is unchanged. Two test cases in `font-families-derivation.test.tsx` updated to assert the new behavior. Stock themes (no `weights:` in YAML) fall through to defaults unchanged.
