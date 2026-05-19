---
"@loworbitstudio/visor": minor
---

VI-424 feat: `avatar-stack` block — overlapping avatars with `+N more` overflow indicator.

A new `data-display` block composes the existing `Avatar`, `AvatarImage`, and `AvatarFallback` primitives into an overlapping cluster — no new primitive, no new tokens, no new ARIA pattern. `npx visor add --block avatar-stack` auto-pulls the `avatar` primitive. Each avatar carries an outward ring (`box-shadow` against `--surface-default`) so the stack reads cleanly against any tone; `Avatar`'s `overflow: hidden` makes outward projection the safe choice. Avatars after the first overlap by `calc(-1 * var(--spacing-2))` with `isolation: isolate` on the root keeping the stacking context contained. The `+N more` indicator is itself an `Avatar` with a `+N` fallback so it inherits size and ring. `total` may exceed `avatars.length` to support server-truncated data — the block computes `overflow = total - visible.length`. `role="img"` plus a `label`-overridable `aria-label` (defaulting to `` `${total} members` ``) announces the cluster as a single image rather than each fallback character.
