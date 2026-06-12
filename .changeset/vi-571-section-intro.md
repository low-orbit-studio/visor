---
"@loworbitstudio/visor": minor
---

Add `SectionIntro` marketing component (VI-571) — eyebrow + display heading + optional lede pattern that opens a marketing section.

- **Component** — `SectionIntro` with `eyebrow`, `heading`, `lede`, `align` (`left` | `center`), `headingAs`, and `as` props. Registered in the Visor registry.
- **Eyebrow color** — driven through `--section-intro-eyebrow-color` so consumers can bind the eyebrow to any live-rewritten CSS var (e.g. a keyed `--color-acid` brand accent).
- **CSS Module** — `section-intro.module.css` using tokenized spacing, font, and color vars; pure CSS attribute-selector alignment variants.
- **Docs** — specimen page added to the General category at `/docs/components/general/section-intro`.
