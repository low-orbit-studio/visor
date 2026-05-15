---
"@loworbitstudio/visor-core": minor
---

VI-382 feat: add `StatusDot` primitive — a 6×6px tone-tinted indicator dot.

Ships a new `components/ui/status-dot/` primitive with five tones (`mint`, `warn`, `muted`, `danger`, `info`) that resolve from Visor's saturated semantic surface tokens (`--surface-success-default`, `--surface-warning-default`, `--text-tertiary`, `--surface-error-default`, `--surface-info-default`). Reuses the same fill tokens as `StatusBadge`'s leading indicator so the two read as one coherent system across admin surfaces.

The dot is decorative by default (`aria-hidden="true"`) — semantic status is expected to live in the adjacent label. Supplying `aria-label` flips it into a labeled image (`role="img"`) for standalone usage where no adjacent text carries the meaning.

Composes inside `Badge`, `ActivityFeed` leading slots, and table status cells. The 6px size and circular radius are intentional and fixed — for larger callouts, use `StatusBadge` instead.
