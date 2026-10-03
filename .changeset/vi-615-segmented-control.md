---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

Add SegmentedControl, a single-select pill group with a sliding active indicator. It is a thin wrapper over ToggleGroup (`type="single"`, `variant="outline"`) behind an `options` / `value` / `defaultValue` / `onValueChange` API, with per-option `icon` and `disabled`. One option is always on: clicking the active segment keeps it and `onValueChange` never receives an empty string, controlled or not. `fullWidth` gives equal-width segments that span the container. The resting edge comes from the shared `--control-edge-*` tokens (`--control-edge-width: 0` removes it, focus stays visible), labels are medium weight, and the indicator slides unless `prefers-reduced-motion` is set. `npx visor add segmented-control` also adds `toggle-group`.

New theme-bindable family `components.segmented-control`: `track-bg`, `indicator-bg` and `indicator-text` (`--segmented-control-track-bg`, `--segmented-control-indicator-bg`, `--segmented-control-indicator-text`). Unbound, the control renders as ToggleGroup's outline treatment on a recessed track.
