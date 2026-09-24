---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

Autosave (VI-657): a `useAutosave` hook and a `SaveStatus` readout. There is no Save button.

- **`useAutosave(value, write, { delay = 600, validate, isEqual })`.** Debounces the write and runs one write at a time, so the newest value wins; a response from an older write never overrides a newer state. It flushes a pending change on `pagehide`, when the tab is hidden, on `beforeunload` and on unmount (`write` gets `{ leaving: true }` for `keepalive`). `beforeunload` warns only while a write is in flight. A value `validate` refuses is never written. It reports `saved` · `saving` · `unsaved` · `refused`, with `retry()` and `flush()`.
- **`SaveStatus`.** Shows Saved / Saving / Unsaved / Couldn't save in a fixed-width slot that never reflows its row; a longer custom label truncates inside the slot. It is an `aria-live="polite"` status region, with a retry mark after a failed save, and it draws no edge.
- **Tokens.** New `components.save-status` family: `width`, `font-family`, `text-transform` and `letter-spacing`. The retry mark reads the icon Button's `icon-size`, `icon-pad` and `icon-ghost-color`.
- **Schema fix.** The `field`, `button`, `text` and `switch` families (VI-656) sat under `colors` in `visor-theme.schema.json`. They now sit under `components`, where themes set them.
