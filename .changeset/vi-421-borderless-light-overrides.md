---
"@loworbitstudio/visor-core": patch
---

VI-421 fix: Borderless/light covers all surface/interactive/border tokens — closes loop on VI-420's first-run signal.

`themes/borderless.visor.yaml`'s `overrides.light` block previously covered 10 tokens; the theme engine emitted 25 additional surface/interactive/border tokens with bright defaults (`#ffffff`, `#f5f5f5`, etc.), so any surface bound to `surface-subtle`, `surface-interactive-*`, `surface-selected`, `surface-accent-subtle`, status `-subtle`, `surface-elev-*`, `interactive-secondary-*`, `interactive-ghost-*`, or `border-disabled` rendered with bright backgrounds — and Borderless's near-white text became invisible. Exactly the leak class VI-420's new `INCOMPLETE_OVERRIDE` check flagged on first run, and the same shape as VI-417 (Blackout).

Borderless/light now renders as a near-identical sibling of Borderless/dark, honoring the always-dark contract. All `*-border` tokens and `border-disabled` stay `transparent` to honor the "borderless" theme contract. Solid-hex values preserve Borderless's flat palette (Blackout uses rgba whites for glass; Borderless does not). Status `-default` colors stay vivid in both modes. No primitive changes; no API surface change; Borderless/dark untouched; other themes unaffected.
