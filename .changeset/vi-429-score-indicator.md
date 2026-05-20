---
"@loworbitstudio/visor": minor
---

VI-429 feat: `score-indicator` Visor primitive — compact circular ring for percentage / ratio metrics.

Ships a new admin primitive installable via `npx visor add score-indicator` for health-score / uptime / engagement style metrics. Renders an SVG ring (track + indicator) with the value centered inside, an optional `/ N` denominator (trailing or below), and an auto-toned color mapping (`>=85%` success, `60-85%` info, `40-60%` warning, `<40%` destructive) that can be overridden with an explicit `tone`. Destructive and warning tones add a small phosphor icon overlay at the top-right of the ring as a non-color cue. Three sizes (24 / 36 / 56 px ring), `role="img"` with a default `"X out of Y"` aria-label, and theme integration via CSS custom properties so consumers can tune ring + value colors without forking.

Codifies the inline custom HTML in the organization-management Phase 1.5 prototype as a first-class primitive. Adjacent primitives consulted: `stat-card`, `stat-hero`, `badge`, `progress` — none cover circular / ratio rendering. Replaces the inline HTML in admin dashboards built on Visor.
