---
"@loworbitstudio/visor": patch
---

`visor init --template nextjs` now applies the theme's declared `color-scheme` (BO-55/56) at the generated root layout. `generateNextjsLayout()` reads the starter `.visor.yaml` via a new `extractColorScheme()` reader (mirroring `theme-sync`'s `extractDefaultMode()` parsing style) and emits: `dark-only` → `<html className="dark" suppressHydrationWarning>` + inline `color-scheme: dark` + forced FOWT `generateFowtScript({ defaultTheme: "dark" })`; `light-only` → the inverse; `adaptive`/unset → the historical prefers-color-scheme layout, byte-for-byte unchanged. The starter yaml documents the `color-scheme` field so the mechanism is discoverable. This generalizes the animal-booking PR #11 fix into the scaffold so a dark-only brand can no longer scaffold a light-rendering root.
