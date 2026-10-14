---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor": minor
---

ToggleGroup theme keys (VI-709).

A new `toggle-group` component-token family lets a theme set the group's look,
with no tokens on the group itself. Every key falls back to what the group read
before, so a theme that sets none of them renders exactly as it did:

- `track-bg` (`--toggle-group-track-bg`): the outline track's fill. Falls back to
  `transparent`, at zero specificity, so a consumer class still sets it.
- `selected-bg` and `selected-text`: the selected option's fill (the sliding
  indicator, or the item in the default variant and a multiple group) and ink.
  They fall back to `--interactive-primary-bg` and `--interactive-primary-text`.
- `unselected-text`: every other option's ink. Falls back to `--text-primary`.
- `xs-font-size`, `xs-padding-x`, `xs-track-radius` and `xs-item-radius`: the
  compact size's label, option sides, track corners and option corners.
  SegmentedControl, built on ToggleGroup, takes the `xs` option keys too; it
  keeps its own track, pill and inks.
