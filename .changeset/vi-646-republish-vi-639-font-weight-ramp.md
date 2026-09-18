---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor-core": minor
---

> **Republish (VI-646).** The work below merged in #717 but its changeset declared
> `"@loworbitstudio/visor"` — the CLI — while the code it changed lives in `packages/theme-engine` and `packages/tokens`.
> Version Packages #718 released the CLI; neither `@loworbitstudio/visor-theme-engine` nor `@loworbitstudio/visor-core` was never bumped, so this fix sat on
> `main` unpublished. This entry re-declares it against the right package(s). No code changed.

VI-639: `--font-weight-semibold` is a step on the weight ramp again, not the theme's heading weight, and the `weights` array a theme declares is now authoritative.

`semibold` was emitted as `typography.heading.weight`, which is a different concept. On any theme whose heading weight is 500 it was identical to `--font-weight-medium`, so a component author asking for a step above medium silently got medium. Where the heading weight is 400 it collapsed onto `normal`. Where it is above 700 it inverted the ramp — `strata` shipped `semibold: 800` over `bold: 700`. Meanwhile `medium: 500` and `bold: 700` were bare literals that ignored the declared `weights` entirely, so a theme declaring `[200, 400, 600, 900]` got tokens naming faces it never fetched.

**Why it could not simply be unpinned.** `--font-weight-semibold` was the *only* channel a theme's heading weight had: `packages/tokens` defined `--weight-heading: var(--font-weight-semibold)`, the engine emitted no per-theme value, and `Heading` defaults to a semibold weight. Changing semibold alone would have flattened every heading in every app.

**What changed**

- **Role primitives.** `--font-weight-heading`, `--font-weight-body` and `--font-weight-display` are emitted per theme from `typography.<slot>.weight`, and the semantic `--weight-heading` / `--weight-body` roles resolve through them. They are `--font-weight-*` primitives rather than the bare `--weight-*` names on purpose: the semantic names live in `@layer visor-semantic`, which wins over `visor-primitives`, so a theme writing them directly would be overridden by the tokens package on a `:root`-scoped consumer.
- **The named ramp resolves against loaded faces.** On any theme declaring a `weights` array, `normal / medium / semibold / bold` resolve through the CSS font-matching algorithm (CSS Fonts 4 §5.2) against that set. The browser already performs this substitution at render time, so the emitted token becomes the weight that was *already rendering* — verified against Chrome's own engine across 23 target/face combinations. Themes that declare no `weights` array keep the historical literals.
- **The declared ladder is reachable.** `--font-weight-<n>` is emitted for every weight in the array, following the `--text-N` / `--space-N` precedent from VI-451. Blacklight's 800 had no name before; BL-987 had to write a literal `font-weight: 700`.
- **`Heading` gains `weight="heading"`, now its default.** It follows `--font-weight-heading`, so heading weight keeps tracking the theme on every shipped theme while `weight="semibold"` becomes a genuine ramp step. The previous four values are unchanged.
- **Two build-time warnings.** `FONT_WEIGHTS_UNDECLARED` when a theme loads from a hosted source but declares no `weights` array; `FONT_WEIGHT_RAMP_COLLAPSED` when a family cannot separate adjacent named steps. Warnings, not errors — substitution is legal CSS and every shipped theme relied on it.

**Migration.** Eleven of the seventeen shipped themes emit the same rendered weights. Six change, and each is a correction: the three Blacklight themes get `semibold: 700` instead of a second `medium: 500`; `knowmentum` gets `semibold: 500` instead of a `semibold` identical to body; `strata`'s inverted `semibold: 800` becomes `700`; `sked` gets the real `600` it loads instead of `700`. Where `medium` moves (e.g. `500` → `400` on a `[400, 700]` family) the rendered face does not: 500 was already being substituted.

A consumer that relied on `--font-weight-semibold` carrying the theme's heading weight should move to `--font-weight-heading` (or `Heading`'s `weight="heading"`).
