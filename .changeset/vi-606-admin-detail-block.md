---
"@loworbitstudio/visor": minor
---

Add the `admin-detail` block — a full-page, read-oriented detail RECORD for the admin-shell main column (VI-606). It is the natural sibling to `admin-detail-drawer` (a right-side drawer) and `admin-list-page`: an identity header (media + title + composed `StatusBadge` + actions), N key-value sections built on the blessed `KeyValueList`, an optional sensitive/reveal panel gated behind a `Switch` (for tax IDs, banking, W-9 data), and optional sub-list slots for ledgers or history — all separated by `Separator` hairlines and fully token-driven. Resolves the Animal §04 Artist Detail gap where `npx visor check has admin-detail` returned NOT FOUND. Install with `npx visor add --block admin-detail`; the registry pulls in `key-value-list`, `status-badge`, `switch`, and `separator`.
