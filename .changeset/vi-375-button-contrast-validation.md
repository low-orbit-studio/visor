---
"@loworbitstudio/visor-theme-engine": minor
---

Theme engine: derive interactive `*-text` colors from the paired `*-bg` luminance instead of hardcoding white, with new theme-level `text-on-light` / `text-on-dark` defaults (theme-overridable; per-token overrides still win). The contrast validator now checks every interactive `*-text` vs `*-bg` pair (both modes) and reads post-override `interactive-*-bg` values, so a bright brand button bg with white text (e.g. ENTR mint) now raises a WCAG_CONTRAST warning (VI-375).
