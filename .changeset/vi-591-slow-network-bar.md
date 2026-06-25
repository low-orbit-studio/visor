---
"@loworbitstudio/visor": minor
---

feat: add SlowNetworkBar component and useSlowRequest hook (VI-591)

Adds the `SlowNetworkBar` component and `useSlowRequest` hook — the Borealis slow-network loading-accuracy pattern.

**Component.** A 4px indeterminate progress bar that renders immediately below the navigation bar. Appears only after a configurable threshold (default 3 000 ms) so fast requests never trigger it. Three states: `hidden` (opacity 0, pointer-events none), `visible` (indeterminate sweep animation, fades in over 300 ms), `resolving` (sweep completes to full width then fades out over 800 ms).

**Hook.** `useSlowRequest(threshold?)` manages the timer automatically. Call `trigger()` when a request starts, `resolve()` in a `finally` block when it completes. If the request finishes before the threshold the bar never appears — no phantom successes, accurate pending indication on 3G.

**Composition rules.** Never alongside Skeleton in the same loading zone (choose one). On error, call `reset()` and let the error pattern take over. Non-blocking — users can navigate away while the bar is visible.

**Animation.** CSS keyframe indeterminate sweep (`1.8s ease-in-out`, looping) with `opacity: 0` as the resting/hidden state — SSR-safe, no JS mount visibility gate. `prefers-reduced-motion`: sweep pauses, bar renders as a static full-width strip.

**Accessibility.** `role="progressbar"`, `aria-valuemin={0}`, `aria-valuemax={100}`, dynamic `aria-busy` (true when visible or resolving), configurable `aria-label`.

**Tokens.** All values reference Visor semantic tokens: `--primary` / `--accent` (fill gradient), `--motion-duration-300` / `--motion-easing-ease-out` (entrance), `--motion-easing-ease-in` (exit), `--motion-easing-ease-in-out` (sweep), `--opacity-40` (reduced-motion static indicator).
