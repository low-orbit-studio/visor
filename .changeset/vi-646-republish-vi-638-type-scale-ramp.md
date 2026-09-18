---
"@loworbitstudio/visor-theme-engine": minor
---

> **Republish (VI-646).** The work below merged in #716 but its changeset declared
> `"@loworbitstudio/visor"` — the CLI — while the code it changed lives in `packages/theme-engine`.
> Version Packages #718 released the CLI; `@loworbitstudio/visor-theme-engine` was never bumped, so this fix sat on
> `main` unpublished. This entry re-declares it against the right package(s). No code changed.

VI-638: `typography.scale` now multiplies the `--font-size-*` ramp it always claimed to, and it is the only mechanism that sets type size.

The schema promised "type scale multiplier applied to the font-size ramp." The generator wrote a standalone `font-size: <scale>rem` on the host selector and left the ramp as a literal map. On a theme scoped with `scopePrefix` (the VI-368 body-class repaint pattern), the root element stays at 16px, so the ramp never moved:

```
<html> font-size          16px
<body> computed           13.6px   ← the 0.85 landed here
var(--font-size-base)     16px     ← and nowhere near here
```

An element inheriting the body size and an element asking for `--font-size-base` rendered 17.6% apart — a wider gap than a full step of the ramp they both belong to (12→14 is 16.7%). Reaching for a token got you a size that matched nothing around it.

Two other implementations of the same field went with it:

- The docs adapter turned `scale` into `size-adjust: <scale*100>%` on `@font-face`, and only for `visor-fonts` slots — so a Fontshare or Google theme got nothing, and against a scaled ramp it would have shrunk twice. It is removed. `size-adjust` is a font-metric correction rather than a type-scale one; if a theme needs it, it belongs in its own optional field.
- The Flutter adapter ignores `scale` entirely. That is unchanged, but the schema now says so instead of implying otherwise.

**What changed**

- `--font-size-*` are multiplied by `typography.scale`, from one ramp definition shared by the core generator and the docs adapter.
- The bare `font-size` declaration is gone from the primitives block. The page inherits the scaled base through `font-size: var(--font-size-base, 1rem)` — on `body` (nextjs base layer) or the docs scope class, deliberately never on `:root`. The ramp is expressed in `rem`, so scaling the root as well would apply the factor a second time.
- The `theme-font-scale-adjust` validate rule, which required `size-adjust` on scaled themes, is replaced by `theme-type-scale-ramp`, which checks that the ramp responds, the page is bound to the base step, and no `size-adjust` remains.

**Migration.** `scale: 1` output is byte-identical, so any theme that does not declare a scale is untouched — that is 14 of the 17 currently shipped. On a theme that does (`blacklight`, `blacklight-pro`, `blacklight-aqua`, all at 0.85), the rendered body size does not move; `--font-size-base` moves to meet it, from 16px to 13.6px, and every other step scales with it. Consumers of `var(--font-size-*)` on those themes get the ~15% they asked for when they set the scale, at the point they re-run `visor theme apply`.

A consumer passing `includeBaseLayer: false` supplies its own reset and must now bind the base size itself — on `body`, not `:root`.
