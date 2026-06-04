---
"@loworbitstudio/visor": minor
---

Add `key-value-list` — a definition-list display primitive for one record's attributes (the "key facts" panel on detail / inspector pages). Renders semantic `<dl>`/`<dt>`/`<dd>` pairs in a responsive grid; each value is an arbitrary `ReactNode` (Badge, AvatarStack, StatHero, ScoreIndicator, or plain text). Supports 1–4 columns, `stacked`/`horizontal` orientation, and `compact`/`default`/`editorial` density.

Fills the organization-management pattern's Screen-2 facts-row gap that previously fell back to a hand-rolled `<dl className="key-value-list">` local stub.
