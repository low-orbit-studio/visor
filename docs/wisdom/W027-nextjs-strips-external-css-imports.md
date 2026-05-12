# W027 — Next.js strips external `@import` from bundled CSS — inject `<link rel="stylesheet">` instead

## Lesson

A theme CSS file that begins with `@import url("https://api.fontshare.com/v2/css?f[]=satoshi@400,700&display=swap");` will load Satoshi correctly when the file is served as a plain stylesheet (vanilla `<link rel="stylesheet" href="theme.css">`). It will silently fail to load Satoshi when that same file is `import`-ed in a Next.js app, because Next.js's CSS pipeline (both webpack and Turbopack, default config) strips external `@import` statements during the production build.

Verified empirically on visor.design after VI-359 shipped:

- Committed `packages/docs/app/blackout-theme.css` first line: `@import url("https://api.fontshare.com/v2/css?f[]=satoshi@400,700&display=swap");`
- Bundled chunk first line on production: `@layer visor-primitives,visor-semantic;...` — `@import` gone.
- Grepped every CSS chunk for `googleapis.com` and `fontshare.com` — zero matches across the entire deployment.

What survives bundling: `@font-face` blocks, `@layer` declarations, CSS variables, all selectors. What does not: external `@import url(...)`.

Symptom: the theme's `--font-*` tokens point at a custom family, the browser has no `@font-face` for that family and no `@import` to fetch one, so it walks the fallback stack. On a clean visitor machine this manifests as the user-agent default heading font (Times New Roman on most Chromium builds), not Satoshi.

## Fix

Inject the stylesheet via `<link rel="stylesheet">` in the app's layout `<head>`, alongside `<link rel="preconnect">` hints for both the CSS origin (`api.fontshare.com`) and the woff2 origin (`cdn.fontshare.com`):

```tsx
<head>
  <link rel="preconnect" href="https://api.fontshare.com" />
  <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
  <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,700,900&display=swap" />
</head>
```

The link tag does not pass through the bundler — Next.js renders it verbatim in the document head, the browser issues the request directly, and Fontshare's hosted CSS (which contains the real `@font-face` blocks) loads as normal.

The engine's `@import` emission is still correct: it works for any vanilla consumer (plain HTML page loading a Visor theme CSS via `<link>`). It is specifically Next.js consumers that need the layout-level injection. The engine already returns `<link rel="stylesheet">` link strings via `generateStylesheetLinks()` in `packages/theme-engine/src/fonts/preload.ts` — a future iteration can have the docs site consume those programmatically instead of hard-coding the URL in layout.tsx.

## How to spot

- After making a change that adds an `@import` to an engine-emitted CSS file, view-source on the deployed Next.js page and confirm the link tag (or the `@import` URL) is reachable from the rendered HTML. If neither shows up, the bundler dropped it.
- DevTools Network panel: filter by font/css. If the only requests are from your own origin (`/_next/...`) with no third-party CSS fetches, the bundler stripped the external import.
- Block all font requests in DevTools and reload. If the rendered page looks identical, no theme font was loading anyway — confirms the fall-through to system defaults.

## Tags

nextjs, css, bundling, fonts, fontshare, @import, theming, visor-fonts

## See also

- [W025 — Themes that declare a custom font must emit @font-face](W025-font-coverage-cross-machine.md)
- [W026 — "Free" font licenses often forbid public CDN re-hosting](W026-satoshi-license-forbids-public-cdn.md)
- VI-359 (engine: fontshare source type) — added the `@import` emission
- VI-360 (this fix) — wire the docs site's layout to load Fontshare via `<link>`
