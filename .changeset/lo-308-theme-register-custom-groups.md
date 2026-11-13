---
"@loworbitstudio/visor": patch
---

`visor theme register --group "Low Orbit"` (or "Client") works again. Since the overlay pattern (W015), `theme-config.ts` holds only the stock group and `visor theme sync` builds the custom groups from each YAML's `group`, so register failed with `Group "Low Orbit" not found` for every custom theme. For a group outside `theme-config.ts`, register now checks that the YAML sits in `custom-themes/` with that `group` and edits nothing; `visor theme sync` (the docs `predev`) adds it to the switcher. Stock-group registration is unchanged.
