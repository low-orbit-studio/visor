---
"@loworbitstudio/visor": minor
---

Add `Spinner` — inline loading spinner primitive.

A rotating border ring with a subtle track and tone-colored leading edge. Three sizes (`xs` 12px, `sm` 16px, `md` 24px), two tones (`default` uses `--text-tertiary`, `primary` uses `--primary`). Fully token-pure: stroke widths via `--stroke-width-*`, animation via `--motion-duration-1500` + `--motion-easing-linear`, colors via semantic CSS custom properties. Accessible label contract: `label` prop renders `role="status"` with visually-hidden text; without label, `aria-hidden="true"` (decorative). Reduced-motion: pauses rotation.

Install with `npx visor add spinner`.
