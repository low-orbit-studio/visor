---
"@loworbitstudio/visor": patch
---

`visor add data-table` and `visor add --block admin-list-page` now install `@tanstack/react-table@^8.21.3` instead of the latest major. The data table is written for the v8 API, so an unpinned install resolved to v9 and failed the consumer's type check. Registry dependencies may now carry a version range (`name@range`).
