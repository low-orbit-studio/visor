---
"@loworbitstudio/visor": minor
---

Add `count` and `countTone` props to `TabsTrigger` (VI-459). Renders an inline count
pill after the tab label — ideal for admin tab navs showing filtered counts
("Members 12 / Pending 3 / Roles 4"). `countTone` accepts `"primary" | "neutral"`
(default `"neutral"`); active state (`data-state="active"`) re-tones the pill
automatically via CSS regardless of `countTone`. Works in both `default` and `line`
`TabsList` variants. Existing triggers without `count` render identically. Prop names,
tone values, and `data-tone` attribute match the FilterChip count slot (VI-455) exactly
for a single mental model across Visor.
