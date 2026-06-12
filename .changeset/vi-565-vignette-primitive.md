---
"@loworbitstudio/visor": minor
---

Add `Vignette` visual primitive — fixed, full-viewport radial vignette layer (VI-565).

- **Component** — `components/visual/vignette/vignette.tsx` + `vignette.module.css`. Zero-JS, CSS-only. `position: fixed; inset: 0; pointer-events: none; aria-hidden`. Pixel-identical to Blacklight `.bl-vignette` (BL-326) at defaults.
- **Configurable** — All gradient parameters exposed as CSS custom properties (`--vignette-size-x`, `--vignette-size-y`, `--vignette-position`, `--vignette-transparent-stop`, `--vignette-color`, `--vignette-color-stop`). `zIndex` prop (default `20`).
- **Registry** — Registered in `registry-visual.ts`; available via `npx visor add vignette`.
- **Docs** — New docs page at `/docs/components/visual-elements/vignette`.
