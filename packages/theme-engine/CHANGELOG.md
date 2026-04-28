# Changelog

## 0.4.1

### Patch Changes

- 33f4853: Republish to include `flutterAdapter` export. The 0.4.0 tarball was stale — the local source had added `flutterAdapter` to `adapters/index.ts` but the published artifact did not include it, breaking `@loworbitstudio/visor@0.5.0` (which depends on `^0.4.0`) at import time.

## [Unreleased]

## [0.3.0] - Initial release

### Added

- Initial release of the Visor theme engine for building and distributing design system themes.

## 0.1.0 — Initial Release

### Themes

- **ENTR theme** — First extracted production theme from client project (VI-115)
- **Stock vs custom theme separation** — `themes/` directory split into stock (shipped) and custom (gitignored, consumer-owned) (VI-148)
- **Docs adapter** — `docsAdapter` for registering themes in the fumadocs site (VI-121)
- **Dark-first color scale** — Brand anchor at 500; dark/light scale generated separately to avoid wash-out (VI-152 + subsequent)
- **Label, group, and default-mode fields** — Theme metadata extended for registry and UI display

### Typography

- **Display font slot** — `.visor.yaml` typography section supports a dedicated display font separate from body (VI-118)
- **Font scale adjust** — `size-adjust` on `@font-face` declarations for themes with non-1 typography scale

### Infrastructure

- **Validator hardening** — Dark/light parity warnings; hooks/patterns/registry rule enforcement (VI-152)
- **License & package metadata** — MIT license, keywords, homepage, repository fields (VI-111)
- **npm audit clean** — Resolved all audit vulnerabilities at time of release (VI-108)
- **Removed broken `./fonts` subpath** — Dropped non-functional subpath export that caused resolution errors in consumers (VI-145)
