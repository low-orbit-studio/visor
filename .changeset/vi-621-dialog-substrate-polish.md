---
"@loworbitstudio/visor": minor
---

VI-621: Sync AN-237 dialog-substrate polish into the canonical VI-620 blocks so the app-owned copies don't drift.

- `dialog-form` — the `.panel` hairline is now a token seam (`--dialog-form-panel-border`, defaulting to the hairline) that a theme can null out, plus a `border="default | none"` prop on `DialogFormContent` for a per-instance borderless panel. `DialogFormContent` also gains a `width="sm | md | lg"` axis (~24rem / 30rem default / ~40rem) backed by `--dialog-form-width-sm|md|lg`, replacing the hardcoded `max-width: 30rem`.
- `dialog-field` — `DialogFieldControl` gains a `size="sm | md"` axis that drives the well padding only (label typography unchanged), mirroring the input atom's `--input-padding-sm|md` seams. Default stays `md` (backward-compatible with the fixed-medium VI-620 well); the compact Animal modal-form well opts into `sm` per field.

All defaults preserve the current VI-620 rendering, so existing call sites are unchanged.
