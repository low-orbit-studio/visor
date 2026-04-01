# W007 — Visor Fonts CDN org slug is "low-orbit-studio"

**Tags:** fonts, cdn, r2, infrastructure
**Severity:** Low — wrong org slug gives silent 404s
**Discovered:** 2026-03-31

## Context

The Visor Fonts CDN at `fonts.visor.design` uses R2 object storage with org-based path prefixes. The URL pattern is:

```
https://fonts.visor.design/{org}/{family-slug}/{filename}.woff2
```

## The Lesson

The org slug is **`low-orbit-studio`**, not `low-orbit`. Using the wrong org gives a 404 with no helpful error message.

## Example

```
✅ https://fonts.visor.design/low-orbit-studio/pp-model-mono/PPModelMono-Light.woff2
❌ https://fonts.visor.design/low-orbit/pp-model-mono/PPModelMono-Light.woff2
```

## Prevention

The test fixtures in `packages/cli/src/__tests__/fonts-add.test.ts` and `packages/theme-engine/src/fonts/__tests__/` reference `low-orbit` as a test-only org — don't confuse test fixtures with production values.
