---
"@loworbitstudio/visor": patch
---

VI-623: Close the coverage holes in the `floating-panel-opaque-bg` validator so a floating/portaled panel can no longer ship with a translucent `--surface-card` fill (the recurring dialog-form / command-dialog see-through class).

The rule existed since VI-209 but had four holes that let the blocks through: it scanned only `components/**` (not `blocks/**`), fired only on a hand-maintained name allowlist, matched only `background-color:` (not the `background:` shorthand), and gated on box-shadow. Rewrote it to detect floating panels **structurally** — a `.module.css` is a floating panel when its sibling `.tsx` renders a portaled atom (Radix portal primitive, composed Visor atom by import path, or sonner) — so new floating blocks are covered automatically. It now scans `blocks/**`, matches the shorthand, and flags only when `--surface-card` is the **primary** background token (so `var(--surface-elev, color-mix(…))` is not a false positive). In-flow static surfaces opt out with a `/* opaque-bg-exempt: <reason> */` marker.

Fixed two latent instances the repaired guard now catches: the `dialog` atom's **editorial** density variant and `session-timeout`'s card — both swapped from `--surface-card` to the opaque `var(--surface-popover, …)`. Identical on solid themes; opaque on glass themes.
