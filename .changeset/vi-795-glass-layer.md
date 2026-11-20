---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor-core": minor
---

VI-795: the glass layer. Themes bind glass per tone under `components.glass` (fill, blur, edge, lift, shadow, on-photo ink, and control fill, hover fill, ring, ink and blur). visor-core adds the `[data-glass="on"]` / `[data-glass="off"]` switch, which copies those values (or Visor's defaults) into `--glass-on-*` variables that components read with their solid look as the fallback. Glass is off unless a container turns it on.
