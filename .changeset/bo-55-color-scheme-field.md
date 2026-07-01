---
"@loworbitstudio/visor-theme-engine": patch
---

Add a machine-readable `color-scheme: dark-only | light-only | adaptive` brand-constraint field to the Visor theme schema (both schema JSON copies), runtime validation (`KNOWN_TOP_LEVEL_KEYS` + enum check), and types. Optional on `VisorThemeConfig`; always resolved to `adaptive` on `ResolvedThemeConfig` so existing themes (no field) behave unchanged. Complements `default-mode` (the runtime default) — `color-scheme` is authoritative for the brand-lock. Foundation for the downstream engine/extractor/gate work.
