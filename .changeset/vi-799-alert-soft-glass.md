---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": patch
---

Alert: the soft appearance draws on glass inside the glass layer's `data-glass="on"` switch — the glass fill and blur, a full hairline outline and every tone in the glass ink instead of its tone colour. Off the switch it renders as before, except that the neutral note (`default` and `info`) now draws its icon at the same 32px as every other tone, so every tone's text starts in one column. `--alert-icon-size-note` still binds a smaller note; unbound it now falls back to `--alert-icon-size`.
