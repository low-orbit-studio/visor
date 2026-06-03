---
"@loworbitstudio/visor": patch
---

Alert: replace hardcoded light-mode hex fallbacks in variant CSS with transparent / currentColor / chained semantic fallbacks (VI-413, audit follow-up to VI-408) so Alert degrades gracefully when a theme omits semantic surface/text tokens.
