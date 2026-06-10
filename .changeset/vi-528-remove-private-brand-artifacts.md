---
"@loworbitstudio/visor": patch
"@loworbitstudio/visor-theme-engine": patch
---

Remove private-brand artifacts from the public repo (VI-528). The `theme batch-apply-flutter` generator and CLI help text no longer reference private theme names, and the theme schema's display-label example is genericized. No behavior changes — `packages/visor_themes` now ships only the five stock themes, and the committed Flutter example is generated from the stock Space theme instead of a client theme.
