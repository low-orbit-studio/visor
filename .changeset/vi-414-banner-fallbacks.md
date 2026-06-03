---
"@loworbitstudio/visor": patch
---

Banner: replace hardcoded light-mode hex fallbacks in variant CSS with transparent / currentColor / chained semantic fallbacks (VI-414, audit follow-up to VI-408) so Banner degrades gracefully when a theme omits semantic surface/text tokens.
