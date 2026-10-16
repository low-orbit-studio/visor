---
"@loworbitstudio/visor": patch
---

VI-716: `npx visor add --block design-system-deck` now works on first install into a plain Next.js app.

- **Registry.** The deck depended on `slide-header` (the item is `deck-slide-header`), so the CLI threw "Registry item not found". The deck now also declares `color-bar` and `design-system-specimen`; the specimen block ships `icon-map.tsx` and declares `color-bar` and `font-showcase`; `lib/color-utils` is a registered item (`culori`, `@types/culori`) that `color-bar` and `color-swatch` depend on. Also fixed, found by the new gate: `button` now depends on `tooltip`, which it imports, and `sphere-playground` on `slider-control`.
- **Layout.** The deck fills the viewport by default (`100dvh`, capped by a sized parent) and sets `border-box` inside itself at zero specificity. Before, a host without a global reset got slides 16vw wider than the screen (centered content shifted right, the rest clipped), and a page with no sized parent couldn't scroll the deck at all.
- **Keyboard.** A deck that fills the viewport takes focus on mount, and a dot click hands focus back, so up and down move one slide each without clicking first. Keys typed into form fields and arrow-driven widgets (radio, tabs, toggle group, slider, select) no longer move the deck.
- **Strict consumers.** The deck's whole install set now compiles under `noUncheckedIndexedAccess`, including `button`, `spinner-orb` and `font-showcase`.

New gates: a registry closure test (every dependency name exists, every relative import is installed, every package import is declared) over the source registry, and the VI-628 strict-index check now covers the deck's install set computed from the registry, and fails rather than passes when the compiler can't start.
