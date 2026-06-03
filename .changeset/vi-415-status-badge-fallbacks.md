---
"@loworbitstudio/visor": patch
---

StatusBadge: replace hardcoded light-mode hex fallbacks in variant CSS with transparent / currentColor / chained semantic fallbacks (VI-415, audit follow-up to VI-408) so status tones degrade gracefully when a theme omits semantic surface/text tokens.
