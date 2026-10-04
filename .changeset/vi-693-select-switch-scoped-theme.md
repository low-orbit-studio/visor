---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor": minor
---

Select and Switch inside a dark, borderless, class-scoped theme (VI-693).

`SelectContent` takes an optional `container`, forwarded to the Radix Portal, as
`TooltipContent` does. Pass the root of a class-scoped theme and the open menu
mounts inside it, so it reads that theme's tokens instead of the page's. Unset,
it portals to `document.body` as before.

Switch gains four colour keys in the `switch` component-token family, each
falling back to the token it read before, so every existing theme renders
exactly as it did:

- `knob-bg` (`--switch-knob-bg`) and `knob-bg-checked`
  (`--switch-knob-bg-checked`), the knob fill per state. Both fall back to
  `--surface-page`. A dark theme binds `knob-bg`: its black page colour is a
  black knob that a dark track cannot hold at 3:1 (WCAG 1.4.11).
- `track-hover-bg` (`--switch-track-hover-bg`) and `track-hover-bg-checked`
  (`--switch-track-hover-bg-checked`), the track fill under the pointer per
  state. Both fall back to `--border-strong`, which a borderless theme sets
  transparent, so the hovered track vanished.
