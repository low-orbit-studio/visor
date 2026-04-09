# Wisdom Index

> Hard-won lessons from this project. Project-specific truths that apply here.

## How This Works

This is the **local** wisdom index for Visor. Entries here are lessons specific to this project's codebase, architecture, or tooling. When a lesson proves universal across projects, promote it to global wisdom using `/lo-wisdom promote`.

For global wisdom (universal lessons): [`~/Code/low-orbit/low-orbit-playbook/roots/foundations/wisdom/wisdom.md`](~/Code/low-orbit/low-orbit-playbook/roots/foundations/wisdom/wisdom.md)

## Entries

| ID | Topic | Tags | File |
|----|-------|------|------|
| W001 | vitest-axe requires custom type declarations | testing, typescript, a11y | [W001](W001-vitest-axe-types.md) |
| W002 | cmdk requires scrollIntoView mock and axe-core rule exception | testing, cmdk, a11y, jsdom | [W002](W002-cmdk-jsdom-mocks.md) |
| W006 | Wrangler R2 CLI defaults to local simulator | cloudflare, r2, wrangler, infrastructure | [W006](W006-wrangler-r2-gotchas.md) |
| W007 | intl-tel-input focus loss prevention via callback refs | intl-tel-input, react, focus, refs | [W007](W007-intl-tel-input-focus.md) |
| W008 | Visor Fonts CDN org slug is "low-orbit-studio" | fonts, cdn, r2, infrastructure | [W008](W008-visor-fonts-cdn-org.md) |
| W009 | `<code>` elements inherit global badge styles — use `<span>` with font-family on colored surfaces | css, typography, color, specimen | [W009](W009-code-element-badge-styles.md) |
| W010 | Every theme must explicitly define `--font-mono` or it silently falls back to sans-serif | tokens, typography, themes | [W010](W010-theme-font-mono-required.md) |
| W011 | Script CSS insertion must target first selector rule, not first `{` (avoids landing in @font-face) | scripts, css, themes, automation | [W011](W011-theme-css-script-insertion.md) |
| W012 | Docs MDX components require a `'use client'` re-export shim in `packages/docs/components/ui/` | docs, nextjs, mdx, imports | [W012](W012-docs-component-shims.md) |
| W013 | R2 endpoint must not include bucket name — causes doubled path on upload | cloudflare, r2, fonts, infrastructure | [W013](W013-r2-endpoint-bucket-doubling.md) |

## Adding Entries

Use `/lo-wisdom` to capture new entries. The skill handles formatting, scope determination, and index updates.
