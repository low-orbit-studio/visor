---
title: "Visor's css-module-types-sync validator parses dotted tokens inside CSS comments as…"
author: Justin
date: 2026-10-30
id: l-c7b22056
scope: repo
status: active
touches:
  - scripts/rules/css-module-types-sync.ts
---

## Decided
Visor's `css-module-types-sync` validate rule (`scripts/rules/css-module-types-sync.ts`, warnOnly but `validate:strict` fails on warnings) extracts class names with `/\.([a-zA-Z_][\w-]*)\b/g` after stripping only `:global(...)` — it does NOT strip `/* */` comments. So any `.word` token in a CSS-module comment is mis-read as a required class and flagged "Missing in .d.ts".

Gotchas that trip it (all from VI-578 comments):
- `e.g.` → captures `g`
- `avatar.module.css` → captures `module`, `css`
- `` `.avatarLg .avatarFallback` `` / `` `.avatar--overflow` `` → captures those class refs

## Watch out
In `.module.css` comments, never write a leading-dot class reference (`.foo`), `e.g.`, or `file.module.css`. Use "for example", bare class names without the dot, or "the base avatar stylesheet". Also: CSS-module `.d.ts` files are hand-maintained (no generator/fix command) — when you add a non-`:global`-wrapped local class, add it to `<name>.module.css.d.ts` in source order or `tsc --noEmit` fails. Related: reference_turbopack_pure_selector, reference_visor_ci_typecheck_separate.

_From Claude Code's memory of this repo, last updated Jun 25._
