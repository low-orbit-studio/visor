---
"@loworbitstudio/visor": minor
---

VI-383 feat: extend `Progress` with `animate` flag and `size="thin"` variant.

`Progress` now accepts two additive optional props:

- `animate?: boolean` (default `true`) — when `false`, the indicator drops its CSS transition for instant paint. Use for static admin chrome where the bar mounts at its final value.
- `size?: "default" | "thin"` (default `"default"`) — `"thin"` renders a 4px-tall capacity bar styled with `--surface-interactive-active`, intended for KPI strips and time-until indicators inside admin chrome.

Existing consumers render byte-for-byte identically: no `data-*` attributes are emitted when both props are omitted, and the existing 12px animated track remains the default. The thin variant is the same primitive — not a fork — opted into at the call site with `<Progress value={…} size="thin" animate={false} aria-label="…" />`.
