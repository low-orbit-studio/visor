---
"@loworbitstudio/visor": minor
---

Add a `size` prop (`"sm" | "md" | "lg"`) to Badge (VI-457). Sizing is now token-driven per size — `sm` is tighter for dense inline data contexts, `md` (the default) reproduces the original badge sizing byte-for-byte, and `lg` is larger for editorial contexts like page headers and stat-card status pills. The fixed `height: 1.25rem` is dropped in favor of padding + `line-height: 1` (intrinsic height, matching Button), and embedded leading icons scale with the size step (`sm` 0.75rem / `md` 0.875rem / `lg` 1rem). `size` mirrors Button's convention exactly and defaults to `md`, so every existing `<Badge>` call site renders unchanged at the pixel level.
