/**
 * visor tokens list
 *
 * List all design tokens from the manifest, with optional --category filter
 * and --json output for AI agents.
 */

import { loadManifest } from "../registry/resolve.js"

export interface TokensListOptions {
  json?: boolean
  category?: string
}

export async function tokensListCommand(
  _cwd: string,
  options: TokensListOptions
): Promise<void> {
  const manifest = loadManifest()

  if (!manifest.tokens) {
    const err = {
      success: false,
      error:
        "Tokens section not found in manifest. Run npm run build:manifest to rebuild.",
    }
    if (options.json) {
      console.error(JSON.stringify(err))
    } else {
      console.error(err.error)
    }
    process.exit(1)
  }

  const { primitives, semantic, adaptive, summary } = manifest.tokens

  // Determine token set based on --category
  let tokens = [...primitives, ...semantic, ...adaptive]
  let categoryLabel = "all"

  if (options.category) {
    const cat = options.category.toLowerCase()
    if (cat === "primitives") {
      tokens = primitives
      categoryLabel = "primitives"
    } else if (cat === "semantic") {
      tokens = semantic
      categoryLabel = "semantic"
    } else if (cat === "adaptive") {
      tokens = adaptive
      categoryLabel = "adaptive"
    } else {
      const err = {
        success: false,
        error: `Unknown category "${options.category}". Use: primitives, semantic, adaptive`,
      }
      if (options.json) {
        console.error(JSON.stringify(err))
      } else {
        console.error(err.error)
      }
      process.exit(1)
    }
  }

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          success: true,
          tokens,
          summary: {
            total: tokens.length,
            category: categoryLabel,
            allTotal: summary.total,
          },
        },
        null,
        2
      )
    )
    return
  }

  // Human-readable output
  console.log(
    `\nVisor Tokens (${categoryLabel}) — ${tokens.length} tokens\n`
  )
  for (const t of tokens) {
    console.log(`  ${t.name}  [${t.tier}]`)
    if (t.description) {
      console.log(`    ${t.description}`)
    }
    console.log(`    Light: ${t.defaultLight}`)
    console.log(`    Dark:  ${t.defaultDark}`)
  }
  console.log(
    `\n  Total: ${tokens.length} tokens shown${
      categoryLabel !== "all" ? ` (${summary.total} total across all tiers)` : ""
    }`
  )
}
