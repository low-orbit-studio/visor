---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor-core": patch
---

Add ResizableSplit, two panes side by side with a draggable divider. `minStart` and `minEnd` hold each pane's minimum width; `size` (controlled) or `defaultSize` sets the start pane's width in px, and `onSizeChange` reports it, so an app can remember it per device. The divider is a focusable `role="separator"` with `aria-valuenow`, `aria-valuemin` and `aria-valuemax`: arrows step by `step` (16px), Shift + arrows four times that, Home and End go to the minimums. A drag captures the pointer and turns off pointer events on both panes, so an iframe cannot swallow it. The new `resizable-split` component-token family (`divider-color`, `divider-hover-color`, `divider-active-color`) draws the line at rest, on hover and while dragging. `npx visor add resizable-split`.
