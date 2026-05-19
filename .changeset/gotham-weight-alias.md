---
"@loworbitstudio/visor-theme-engine": patch
---

chore(theme-engine): add Gotham weight alias (400 → Book)

Hoefler's Gotham uses "Book" instead of "Regular" at weight 400. Light (300) and Medium (500) match `WEIGHT_NAMES` defaults. Knowmentum theme consumes Gotham via the visor-fonts CDN; this alias makes `fonts.visor.design/low-orbit-studio/gotham/Gotham-Book.woff2` resolve.
