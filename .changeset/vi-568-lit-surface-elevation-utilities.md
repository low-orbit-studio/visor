---
"@loworbitstudio/visor-core": minor
---

Add lit-surface elevation utilities — three opt-in CSS utility classes (`.lit`, `.lit-soft`, `.lit-strong`) with a live keyed accent halo via `--lit-color` (VI-568).

Ported from Blacklight's `.bl-lit` / `.bl-lit-soft` / `.bl-lit-strong` globals where they power the carousel-keyed artist color glow on every framed surface.

- **`.lit`** — standard depth: inset top highlight + deep drop shadows + `color-mix` accent halo at 22%
- **`.lit-soft`** — gentle lift: inset highlight + single drop shadow, no halo
- **`.lit-strong`** — dramatic depth: stronger drop shadows + `color-mix` accent halo at 30%
- **`--lit-color`** — runtime color contract; defaults to `var(--accent, var(--color-primary-500, #6366f1))`; consumer may rewrite per-frame for live color tracking
- Distributed via `@loworbitstudio/visor-core/utilities` (opt-in, not bundled into `index.css`)
