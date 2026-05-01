---
"@loworbitstudio/visor": patch
---

Fix `SourceInspector` misclassifying Visor renders as `"third-party"` on Turbopack (Next 16 default). Turbopack's bundled chunk URLs hash away the package path — Visor components come from `node_modules_<hash>._.js` instead of `node_modules/@loworbitstudio/visor/...`, so the default `visor` predicate's `path.includes("@loworbitstudio/visor")` never matched. The classifier now consults `_debugOwner.type.name`/`displayName` against a precomputed Set of known Visor component names (generated from the registry at build time, shipped as `visor-component-names.generated.ts`) before falling back to URL-based classification. Names are bundler-independent; URL matching still works for webpack and other bundlers that preserve package paths in chunk URLs. No public API changes — `Classifiers` shape is unchanged and custom classifiers continue to take precedence.
