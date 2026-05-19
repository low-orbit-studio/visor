#!/usr/bin/env node
/**
 * Emit `dist/v4.css` — the static Tailwind 4 `@theme { ... }` block consumers
 * `@import "@loworbitstudio/visor-tailwind-preset/v4.css"` from their global CSS.
 *
 * We can't have `tsup` emit CSS directly, so this post-build step builds the
 * v4 theme from the compiled JS and writes it next to the other artifacts.
 */

import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))

const { buildVisorTailwindV4Theme } = await import(
  resolve(__dirname, "../dist/v4.js")
)

const cssPath = resolve(__dirname, "../dist/v4.css")
writeFileSync(cssPath, buildVisorTailwindV4Theme())
console.log(`✓ wrote ${cssPath}`)
