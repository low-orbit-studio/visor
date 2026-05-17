---
"@loworbitstudio/visor": minor
---

VI-408 fix: Badge variants degrade gracefully when semantic tokens are unbound.

Variant CSS used hardcoded light-mode hex fallbacks (e.g. `background-color: var(--surface-info-subtle, #f0f9ff)`). When a theme bound success/warning but not info/secondary/destructive, Badges rendered in bright light-mode against a dark surface.

This change replaces every hardcoded light-mode fallback with `currentColor` / `transparent` / chained semantic fallbacks (e.g. `var(--surface-X-subtle, transparent)`, `var(--text-X, currentColor)`). When a theme is missing a token, the Badge degrades to a transparent/outline-style appearance rather than a bright chip — a less-broken failure mode that surfaces theme gaps without polluting the UI.

**Visual regression possible** for any theme that relied on the light-mode fallback being visible. The fix is to bind the missing semantic tokens in your theme (theme-best-practice has always been to bind the full semantic contract; this change just makes the failure mode less catastrophic).
