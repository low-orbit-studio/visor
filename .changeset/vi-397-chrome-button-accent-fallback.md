---
"@loworbitstudio/visor": patch
---

VI-397 fix: chrome-button `primary` variant falls back to `--accent-primary` before the bare hex.

`.variantPrimary` background, color, and `:hover` background now read through a documented fallback chain:

- `background-color: var(--interactive-primary-bg, var(--accent-primary, #111827))`
- `color: var(--interactive-primary-text, var(--text-inverse, #f9fafb))`
- `:hover background: var(--interactive-primary-bg-hover, color-mix(in srgb, var(--accent-primary, #111827) 85%, white))`

Themes that bind only `--accent-primary` (not the full `--interactive-primary-*` set) now correctly inherit the brand accent on primary chrome-buttons instead of falling through to a hardcoded `#111827`. Byte-for-byte unchanged for themes that bind `--interactive-primary-bg` explicitly.
