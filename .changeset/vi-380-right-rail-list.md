---
"@loworbitstudio/visor-core": minor
---

VI-380 feat: add `right-rail-list` block — compact vertical list tuned for admin dashboard side rails.

Each row pairs an optional `leading` slot (short label, avatar, badge, status dot), a `primary` label (typically a link), and an optional `trailing` meta value (count, value, or tone-tinted status word). Trailing carries a `data-tone` attribute and accepts `default | mint | muted | warn | danger | info` — extends r3's two-tone palette so the block pairs cleanly with the StatusDot tones landing alongside it.

Supports `compact` density for tighter rails and an `as` prop (`ul | ol | div`) for the root element. Theme-portable: every color, size, and spacing value binds to a Visor semantic token, so the block adopts the active theme without modification. Net-new block; zero impact on existing components. Registered as `category: data-display` so `npx visor add right-rail-list` works.
