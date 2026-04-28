---
"@loworbitstudio/visor-theme-engine": patch
---

Republish to include `flutterAdapter` export. The 0.4.0 tarball was stale — the local source had added `flutterAdapter` to `adapters/index.ts` but the published artifact did not include it, breaking `@loworbitstudio/visor@0.5.0` (which depends on `^0.4.0`) at import time.
