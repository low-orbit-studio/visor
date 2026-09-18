---
"@loworbitstudio/visor": minor
---

VI-643: `Button` takes a `pending` prop, so a consumer never hand-rolls a busy state again.

`Button` exposed `variant`, `size`, `gated` and `gatedReason` — an authorization affordance, but no busy one. Every consumer therefore invented the same thing badly. In animal-booking alone that is 30 hand-rolled busy flags across 19 components, each shaped `{busy ? "Saving…" : "Save"}` + `disabled={busy}`, producing three defect classes that all trace to the same missing primitive:

- **The control resizes.** `size="dlg"` pins height but not width, and modal footers are `justify-content: flex-end`, so swapping `Save` for `Saving…` moves the button and everything beside it.
- **Nothing is announced.** A label change is not spoken; `aria-busy` appeared exactly once in that entire codebase.
- **Fast actions flicker.** With no delay gate and no minimum duration, a 150ms write flashes a busy state for a frame or two.

**What changed**

- `pending?: boolean` — additive and optional. A `<Button>` without it renders byte-identically, and there is a test that asserts exactly that.
- **The geometry is held.** The idle children stay mounted in the box at zero opacity and the busy glyph paints over them in an absolutely-positioned overlay. The control never resizes. This is deliberately not a leading spinner slot: a leading slot adds its own width plus a gap, which is the visible defect the prop exists to remove.
- **`aria-busy="true"`** while the action is in flight, and the **accessible name does not change** — `pendingLabel` is decorative (`aria-hidden`), so the control is not renamed mid-action. Button does not invent a `role="status"` region; a caller that needs the message spoken pairs one with it.
- **Activation is suppressed** for as long as the button looks busy, so `pending` cannot double-submit. Like `gated`, it does *not* set the native `disabled` attribute — the button stays focusable, which matters because it is the user's focus anchor while they wait.
- **Two thresholds, both themeable.** `--button-pending-delay` (200ms) suppresses the glyph for an action that resolves fast enough that showing one would read as a flicker; `--button-pending-min-duration` (300ms) keeps it legible once shown. Per-call-site overrides are `pendingDelay` and `pendingMinDuration`. Neither custom property is declared on `.base` — an element-level declaration shadows anything a theme emits on `:root`, which is the defect VI-625 fixed on Spinner.
- The glyph is the `spinner` primitive rather than a second ring, so `prefers-reduced-motion` is already handled. `button` therefore gains `spinner` as a registry dependency.

**Under `asChild`** the state attributes and the activation suppression still apply, but no chrome is injected — Slot takes a single child, so there is nowhere to put the overlay.

**Migration.** None. `pending` is absent on every existing call site and the rendered output is unchanged without it.
