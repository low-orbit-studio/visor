---
"@loworbitstudio/visor-theme-engine": patch
---

Reconcile the two hand-maintained `visor-theme.schema.json` copies (docs + theme-engine) so they are byte-identical, and add a `schema-copies-sync` validate rule that fails CI the moment they drift again. The engine copy is the source of truth (VI-502 D1); the docs copy now mirrors it. Drops the stale typography `if/then` org-required fossil (superseded by the runtime `cdn-overrides` org exemption) and adopts the more accurate `family`/`source` font-field descriptions in the published schema.
