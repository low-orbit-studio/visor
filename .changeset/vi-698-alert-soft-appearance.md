---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

Alert gains `appearance="soft"` (VI-698): the inline alert Animal Booking and Blacklight each built locally, now one Visor component. A soft tinted fill (`--surface-{tone}-soft`) with no edge and no shadow, an outline tone icon (`WarningOctagon`, `Warning`, `CheckCircle`, 32px; `Info` at 24px for the neutral `default` note, which `info` falls back to), and the body in secondary ink. New `icon` prop replaces the tone's icon; new `AlertLead` sets a bold lead inline in the description. Under `soft`, `role` defaults to `alert` for `destructive` and `status` for the rest; an explicit `role` still wins. An Alert without `appearance` renders exactly as before. The soft sizes are a new `alert` component-token family (`components.alert`: `icon-size`, `icon-size-note`, `soft-padding`, `gap`, `radius`, `font-size`, `lead-font-weight`). The `alert` registry item now depends on `@phosphor-icons/react`. New render fixtures: `alert` `default` / `soft` / `soft-warning` / `soft-success` / `soft-note` / `soft-actions`.
