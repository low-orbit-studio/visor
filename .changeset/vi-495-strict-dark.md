---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor": minor
---

Adds a `--strict-dark` flag to `visor theme validate` that promotes `DARK_LIGHT_PARITY` warnings and missing `colors-dark.neutral` entries from non-blocking warnings to blocking errors. This enforces the "always both modes" authoring convention — every theme that sets `colors.neutral` must also set `colors-dark.neutral` to prevent brand-identical dark mid-surfaces across unrelated themes. The flag is opt-in today; flip to default in CI after all convergent themes supply their dark neutral. Documentation added to the theme authoring guide and CLI reference.
