---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor": patch
---

Typography slots accept `text-transform` (VI-687). `typography.heading | display | body | mono` take `none`, `uppercase`, `lowercase` or `capitalize`, and the engine emits `--font-<slot>-text-transform` only when a theme sets it, so existing themes are byte-identical. A theme such as Animal's, which sets `typography.display.text-transform: uppercase`, now validates and generates. The Flutter adapter does not emit it. `Heading` reads `--font-heading-text-transform`; `PageHeader` (display title) and `SectionIntro` read `--font-display-text-transform`; both inherit when the token is unset.
