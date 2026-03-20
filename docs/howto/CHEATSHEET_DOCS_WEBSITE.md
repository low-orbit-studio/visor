# Docs Website Cheatsheet

## Start Dev Server

```bash
npm run dev -w packages/docs
```

Opens at **http://localhost:9301** (Turbopack enabled).

## Build

```bash
npm run build -w packages/docs
```

## Typecheck

```bash
npm run typecheck -w packages/docs
```

## Key Paths

| What | Where |
|------|-------|
| App root | `packages/docs/app/` |
| MDX content | `packages/docs/content/docs/` |
| Components | `packages/docs/components/` |
| Public assets | `packages/docs/public/` |
| Global CSS | `packages/docs/app/globals.css` |
| Space theme | `packages/docs/app/space-theme.css` |

## Stack

- **Framework:** Next.js 15 (App Router)
- **Docs engine:** fumadocs
- **Fonts:** Syne (headings) + Space Mono (code) via `next/font/google`
- **Theme:** Space theme applied globally — dark background with starfield animation
