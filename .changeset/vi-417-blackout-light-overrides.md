---
"@loworbitstudio/visor-core": patch
---

VI-417 fix: Blackout/light covers all surface/interactive/border tokens — fixes events-route white-on-white.

`themes/blackout.visor.yaml`'s `overrides.light` block previously covered ~16 tokens; the theme engine emitted ~19 additional surface/interactive/border tokens with bright defaults (`#ffffff`, `#f5f5f5`, etc.), so any surface bound to `surface-elev-0/1/2`, `surface-selected`, status `-subtle`, `interactive-secondary-*`, `interactive-ghost-*`, or `border-disabled` rendered with bright backgrounds — and Blackout's near-white text became invisible (events-route white-on-white).

Blackout/light now renders as a near-identical sibling of Blackout/dark — just barely lighter — across every route, honoring the always-dark contract. Status `-default` colors stay vivid in both modes. No primitive changes; no API surface change; Blackout/dark untouched; other themes unaffected.
