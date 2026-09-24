---
"@loworbitstudio/visor": patch
---

Spinner loads `thinking-orbs` only when an orb mounts (VI-660). The ring used to ship the orb's canvas engine too (about 15KB gzipped), because `spinner.tsx` imports `spinner-orb.tsx` and that file imported `thinking-orbs` statically. The orb's box is sized inline, so it holds still while the canvas loads. The API is unchanged.
