---
"@loworbitstudio/visor": minor
---

feat(error-placard): absorb ErrorPlacard from blessed admin builds into canonical Visor

Adds `ErrorPlacard` as a registry component (`npx visor add error-placard`). An inline failed-load placard with a destructive-tinted circular icon chip, title, body, and optional right-aligned recovery actions. Theme-agnostic — all values from design tokens. Disambiguated from Alert (passive semantic callout) and Banner (full-width page bar).
