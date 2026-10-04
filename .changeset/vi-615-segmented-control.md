---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

Add SegmentedControl, a single-select pill group with a sliding active indicator. It is a thin wrapper over ToggleGroup (`type="single"`, `variant="outline"`) behind an `options` / `value` / `defaultValue` / `onValueChange` API, with per-option `icon` and `disabled`. One option is always on: clicking the active segment keeps it and `onValueChange` never receives an empty string, controlled or not. `fullWidth` gives equal-width segments that span the container. The resting edge comes from the shared `--control-edge-*` tokens (`--control-edge-width: 0` removes it, focus stays visible), labels are medium weight, and the indicator slides unless `prefers-reduced-motion` is set. `npx visor add segmented-control` also adds `toggle-group`.

The active pill carries a 1px inset state edge at `--control-state-edge-width` (so it survives `edges: off` and shifts nothing), coloured `--text-primary` by default, which keeps the selected state at 3:1 or better against the pill and the well on neutral and blackout.

Each segment reserves its label's width at both the active and the inactive weight (two hidden, `aria-hidden` copies of the text in a one-cell grid with the visible label), so selecting a segment moves nothing even when a theme binds a heavier `active-weight`.

New theme-bindable family `components.segmented-control`: `track-bg`, `radius`, `indicator-bg`, `indicator-text`, `indicator-edge`, `inactive-text` and `active-weight` (`--segmented-control-*`). `radius` unset keeps each size's ToggleGroup radius; `inactive-text` and `active-weight` default to today's ink and medium weight; `indicator-edge: transparent` turns the state edge off. Unbound, the control renders as ToggleGroup's outline treatment on a well: the page nudged 12% toward the ink (about 1.15 to 1.4:1 against the page on blacklight-app, blackout, neutral and Animal), so the track is visible in dark as well as light.
