# ADR-003: Dual-Brand Variant Pattern for visor_button

**Status:** Proposed
**Date:** 2026-04-28
**Ticket:** [VI-275](https://linear.app/low-orbit-studio/issue/VI-275/research-spike-dual-brand-variant-pattern-for-visor-button)

## Context

SoleSpark's `UIButton` carries a `userType` parameter (`user` vs `seller`) that swaps the button's brand surface and foreground based on which persona owns the surrounding screen. Before porting button improvements from SoleSpark/Veronica/ENTR into Visor, we needed to decide whether and how Visor should generalize this dual-brand pattern.

The candidates doc ([`docs/flutter-widget-candidates.md`](../flutter-widget-candidates.md), Rank #6) flagged this as an "enhancement opportunity" rather than a clean port. Wrong call here forces a downstream API rewrite.

### Source Patterns Reviewed

| Project | Widget | Dual-brand mechanism |
|---|---|---|
| SoleSpark | `UIButton` | `userType: UIButtonUserType { user, seller }` switches `accentPrimary` ↔ `sellerPrimary`. Only affects `primary` and `secondary` styles. |
| Veronica | `VeronicaButton` | None. Single brand via `context.colorway.button.primary`. 5 type variants, no persona switch. |
| ENTR | `ModalActionButton` | None. Hardcoded styling, single-purpose icon+title button — not a generalized button. |
| Visor (current) | `VisorButton` | `VisorButtonBrand { primary, secondary }` already exists. `secondary` routes through `surfaceAccent*` token slots. |

### State of the Existing Visor Implementation

The dual-brand pattern is partially implemented in [`components/flutter/visor_button/visor_button.dart`](../../components/flutter/visor_button/visor_button.dart):

- `VisorButtonBrand { primary, secondary }` enum exists and is wired through `_palette()`.
- `secondary` brand reads from `surfaceAccent*` semantic tokens (`surfaceAccentSubtle`, `surfaceAccentDefault`, `surfaceAccentStrong`).
- **Zero adoption:** no widget tests exercise `brand`, no golden scenarios cover it, no examples or docs reference it. The enum is effectively a ghost feature.
- The SoleSpark Visor example theme (`examples/flutter/solespark-ui/lib/src/colors/visor_colors.dart`) maps `surfaceAccent*` to the **same primary purple scale** as `interactivePrimary*`, so `brand: primary` and `brand: secondary` render nearly identically in the only theme set up to consume them.

### The Slot-Semantics Conflict

`surfaceAccent*` was introduced for **accent surfaces** — visual emphasis variants of the *same* brand (e.g., a highlighted card background, a "featured" chip). Routing the dual-brand button through the same slot conflates two distinct concerns:

- **A. Accent surfaces** — emphasis variant of the same brand
- **B. Alternate brand** — different palette for a sub-brand or persona

A theme cannot serve both meanings of `surfaceAccent*` at once. SoleSpark's user/seller use case is concern B; the slot's name and existing usage point at concern A. Forcing themes to choose between the two is a footgun.

---

## Decision: Skip per-button brand. Use theme nesting for dual-brand.

Remove `VisorButtonBrand` from `visor_button` and recommend `Theme(data: alternateVisorTheme, child: ...)` subtree wrapping for true dual-brand surfaces.

### Candidates Considered

**Option 1 — Skip (chosen).** Remove the `brand` parameter; document theme nesting as the dual-brand pattern.
- Pros: Honors single-purpose token slots. Idiomatic Flutter (theme nesting is standard for persona-scoped surfaces). Zero migration cost — the enum has no consumers. Doesn't bloat token contract for a rare use case.
- Cons: Consumers who want to mix two brands on one screen must wrap subtrees, which is more verbose than a `brand:` param.

**Option 2 — Add dedicated `interactiveAlternate*` token slots.** Introduce a parallel set of brand tokens (`interactiveAlternateBg`, `interactiveAlternateText`, etc.) and route `VisorButtonBrand.secondary` through them.
- Pros: Cleanly separates concerns A and B. Per-component switching stays cheap.
- Cons: Bloats every theme with N more required slots for a use case currently only SoleSpark needs. Introduces "alternate" as a first-class brand concept that other components (chip, badge, link) would also need.

**Option 3 — Status quo + clarify.** Keep `VisorButtonBrand` mapped to `surfaceAccent*`. Document that themes must choose: use `surfaceAccent*` for accent surfaces OR for alternate brand, not both.
- Pros: No code change.
- Cons: Forces every theme into a foot-gunny choice. Token slot semantics permanently muddled. The enum stays an undocumented ghost feature.

### Rationale

1. **The current implementation is unused.** No tests, no goldens, no examples, no docs reference `VisorButtonBrand`. Deleting it is a no-cost simplification.
2. **Token slot semantics matter more than per-component convenience.** `surfaceAccent*` is for accent surfaces of one brand. Reusing it for a second brand permanently confuses the contract for every consumer.
3. **Theme nesting is the right Flutter idiom for persona-scoped surfaces.** Wrapping a seller-context subtree with a different `VisorTheme` swaps colors, typography, spacing, and motion together — not just button colors. This matches the actual mental model of "this whole screen is a different brand context."
4. **SoleSpark's `userType` maps cleanly to nested themes.** SoleSpark already structures screens by persona; the migration becomes "wrap seller screens with `sellerVisorTheme`" instead of "thread `brand: secondary` through every button call site."
5. **Visor stays theme-agnostic.** The component knows nothing about `user` vs `seller`. The semantic difference lives entirely in the theme.

### Trade-off Acknowledged

If a future consumer needs to mix two brands on a single surface (e.g., a side-by-side comparison card with one button per brand), theme nesting at the row level is more verbose than a `brand:` enum would be. We accept this trade-off because:

- The use case has not appeared in any current Low Orbit project.
- A future ADR can revisit this with Option 2 if dual-brand surfaces become common — adding tokens is easier than reclaiming a slot whose semantics are already overloaded.

---

## Consequences

### Immediate

- `VisorButtonBrand` enum and `brand` parameter removed from `visor_button.dart`.
- `_palette()` simplifies — no more brand-conditional branches.
- No migration needed for consumers (zero adoption).
- SoleSpark migration guidance: wrap seller-context subtrees with a separate `VisorTheme` instance.

### Token Contract

- `surfaceAccent*` retains its original meaning: emphasis variant of the active brand.
- No new token slots introduced.
- Theme contract documentation should call out that **persona/sub-brand surfaces are expressed via nested themes, not per-component flags.**

### Future Work

- If a real dual-brand-on-one-surface use case emerges, revisit with Option 2 (dedicated `interactiveAlternate*` slots) rather than reintroducing the conflated `brand: secondary` pattern.
- Theme-nesting recipe should be documented once Flutter docs pages exist on the Visor docs site.

---

## Follow-Up

One implementation ticket created in the Visor team / Wave 2 project to execute the cleanup:

- Remove `VisorButtonBrand` enum, `brand` field, and brand-conditional branches from `visor_button.dart`
- Confirm no consumers break (grep already confirms zero references outside the file itself)
- Update `visor_button.visor.yaml` if it documents the parameter (it currently does not)
- No tests need updating (the existing tests don't exercise `brand`)
