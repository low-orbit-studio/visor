---
"@loworbitstudio/visor": minor
---

feat: add OfflineBanner component (VI-585)

Adds the `OfflineBanner` component and `useNetworkStatus` hook — the Borealis "global state" pattern for network connectivity loss.

**Component.** Full-width sticky banner that pins below the navigation bar using `position: sticky` — does not overlay or block content beneath it. Renders three states: `offline` (dark surface, Wifi-off icon, Retry button), `reconnecting` (spinner replacing icon, Retry hidden), and `restored` (success-tint, check icon, auto-dismisses after 1.5s). Returns `null` when `networkState` is `"online"`.

**Hook.** `useNetworkStatus()` listens to `window`'s `online`/`offline` events and drives the state machine. Accepts an optional `onRetry: () => Promise<boolean>` callback for a real connectivity probe (e.g., a `HEAD /api/health` request). Falls back to `navigator.onLine` when omitted.

**Animation.** CSS keyframe entrance (`200ms ease-out`, slide from top) with `opacity: 1` as resting state — SSR-safe, no JS mount gate.

**Accessibility.** `role="status"`, `aria-live="polite"`, dynamic `aria-label` per state, `aria-hidden` decorative icons, focus-visible Retry button with descriptive `aria-label`.

**Tokens.** All values reference Visor semantic tokens: `--surface-overlay` (dark bg), `--text-inverse` (inverse text), `--accent` (icon + Retry), `--surface-success-subtle` / `--border-success` (restored state), `--motion-duration-normal`, `--motion-easing-enter`, `--stroke-width-thin`, `--spacing-*`, `--radius-*`, `--focus-ring-width`.
