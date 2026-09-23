---
"@loworbitstudio/visor": minor
---

VI-653: `Spinner` gains an orb variant — `<Spinner variant="orb" orb="working" />` renders one of the nine thinking-orbs animations (working, searching, solving, listening, connecting, weaving, composing, breathing, shaping) in place of the ring. `size` maps to the orb's presets (xs 20px, sm 32px, md 64px); the ink follows the surrounding text colour, or the primary token with `tone="primary"`. The `label` contract and reduced-motion still frame hold as they do for the ring. `variant` defaults to `"ring"`, so existing call sites render unchanged. `npx visor add spinner` now also copies `spinner-orb.tsx` and installs `thinking-orbs`.
