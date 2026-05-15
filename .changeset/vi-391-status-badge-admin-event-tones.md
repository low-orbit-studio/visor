---
"@loworbitstudio/visor-core": minor
---

VI-391 feat: `status-badge` adds 5 admin-ui event tones — `live`, `warn`, `scheduled`, `sold`, `draft`.

Extends the `status` prop enum with the admin-v7-r3 event vocabulary so consumers can use `StatusBadge` directly for events tables and content lifecycle UIs without rolling their own local status chips. Each new tone maps to an existing Visor semantic color group — no new tokens are introduced and existing tones are unchanged:

- `live` → success (active/positive event)
- `warn` → warning (needs attention)
- `scheduled` → info (upcoming/planned)
- `sold` → success (positive completed outcome)
- `draft` → neutral (unpublished/muted)

Backwards-compatible. The existing 9 statuses (`healthy`, `degraded`, `down`, `failed`, `running`, `pending`, `queued`, `idle`, `complete`) render identically.
