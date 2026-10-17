---
"@loworbitstudio/visor": minor
---

Kit parts for Animal's Phase 2 (VI-713, VI-714, VI-715). Every addition is opt-in:
a consumer that sets none of the new props renders exactly as before.

- **Text (VI-715):** a `family` variant, `body` (the default, adding no class) and
  `mono` (`--font-mono`, falling back to `ui-monospace, monospace`), composing with
  every size and weight. Two new inks: `color="success"` (`--text-success`) and
  `color="amber"` (`--text-amber`, falling back to `--text-warning`).
- **SegmentedProgress (VI-713):** a `steps` prop puts a label under each segment
  (12px `sm`, 14px `md`, rebindable through `--segmented-progress-sm-label-font-size`
  and `--segmented-progress-md-label-font-size`) and adds a `failed` state (the error
  red, its label bold in `--text-error` with a warning icon; a done label carries a
  check-circle). The fills draw in left to right once on mount, 140ms apart, and draw
  static under `prefers-reduced-motion`. With `steps` the bar is `aria-hidden` and a
  visually hidden summary ("Step 2 of 3: Bank Details", or your `summary`) is read in
  its place. The current segment's fill reads `--button-strong-fill`, falling back to
  the primary. Without `steps`, the markup is unchanged.
- **SuccessFeedback (VI-714):** `SuccessPanel`, the end-of-flow screen: a round
  success seal, a heading announced once on mount through `SuccessLiveRegion`, a
  description, an optional check list and an action slot. Icons are slots, each
  defaulting to a check-circle.
