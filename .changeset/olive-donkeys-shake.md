---
"@loworbitstudio/visor-core": minor
---

VI-617: move the `prefers-reduced-motion` block into the `visor-base` cascade layer

**This changes cascade priority for every consumer of `./css`, `./tokens`, and `.` — read this before upgrading.** It is a behavioural change, not an internal tidy.

`dist/tokens.css` ships a global motion-safety rule:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Until now this was emitted **unlayered** — outside every `@layer`. It is now emitted inside `@layer visor-base`, the first and lowest-priority layer. The declarations themselves, including `!important`, are unchanged.

**What is unaffected.** Motion is still suppressed. Component animations live in unlayered `.module.css` classes, and an `!important` declaration beats a normal one regardless of layer, so the block keeps winning over every component's `animation`/`transition`. Verified in Chromium against the real `skeleton` (`@keyframes`) and `button` (`transition`) module CSS: under `prefers-reduced-motion: reduce` the computed `animation-duration` and `transition-duration` are `0.01ms` before and after this change.

**What changes — and it is the opposite of what you might expect.** `!important` declarations *invert* cascade-layer order: unlayered `!important` is the **lowest**-priority important author declaration, and the first-declared layer is the **highest**. So this block is now **harder** to override with `!important`, not easier:

| Consumer rule (unlayered, loaded after visor-core) | Before | After |
| --- | --- | --- |
| normal declaration, no `!important` | visor-core wins | visor-core wins |
| `!important` declaration | **consumer wins** (source order) | **visor-core wins** |

If you rely on an unlayered `!important` rule to opt a surface out of global motion suppression, that rule **will stop working** on upgrade. Two supported ways to override the block:

```css
/* 1. Declare your own layer ahead of visor-base. */
@layer app, visor-base;
@layer app {
  .my-surface { animation-duration: 3s !important; }
}
```

```html
<!-- 2. Inline style with !important. -->
<div style="animation-duration: 3s !important"></div>
```

**Why make the change at all.** Unlayered styles beat every layered style in the package, so this was the single highest-priority declaration `visor-core` shipped and the one rule the layer system could not reason about. It now sits in the same layer as every other element-level rule visor-core owns (`visor-base`, added in VI-616), which makes the package's cascade behaviour uniform and inspectable. `dist/tokens.css` now contains **no** depth-0 rules at all — every construct in the file is an `@layer` block.
