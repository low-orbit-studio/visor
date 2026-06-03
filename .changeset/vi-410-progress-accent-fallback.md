---
"@loworbitstudio/visor": patch
---

Progress: `.indicator` background-color now chains to `var(--accent-primary)` before the charcoal hardcoded fallback (VI-410), so themes that bind only `--accent-primary` (e.g. ENTR mint) get the brand accent on the progress fill without rebinding `--interactive-primary-bg`. Same chained-fallback pattern applied to any other primitive reading `--interactive-primary-bg`.
