import { loadManifest } from "../registry/resolve.js"
import { logger } from "../utils/logger.js"

export interface InfoOptions {
  json?: boolean
}

export function infoCommand(
  name: string,
  cwd: string,
  options: InfoOptions = {}
): void {
  const json = options.json ?? false

  let manifest: ReturnType<typeof loadManifest>
  try {
    manifest = loadManifest()
  } catch (error) {
    if (json) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(JSON.stringify({ success: false, error: message }, null, 2))
      process.exit(1)
    }
    throw error
  }

  // Search all four manifest namespaces in order: components → hooks → blocks → patterns
  // First match wins
  let kind: "component" | "hook" | "block" | "pattern" | null = null
  let data: unknown = null

  if (name in manifest.components) {
    kind = "component"
    data = manifest.components[name]
  } else if (name in manifest.hooks) {
    kind = "hook"
    data = manifest.hooks[name]
  } else if (name in manifest.blocks) {
    kind = "block"
    data = manifest.blocks[name]
  } else if (name in manifest.patterns) {
    kind = "pattern"
    data = manifest.patterns[name]
  }

  if (kind === null || data === null) {
    const errorPayload = {
      success: false,
      error: `Component ${name} not found. Run visor list --json to see available names.`,
    }
    if (json) {
      console.error(JSON.stringify(errorPayload, null, 2))
    } else {
      logger.error(errorPayload.error)
    }
    process.exit(1)
    return
  }

  if (json) {
    console.log(
      JSON.stringify(
        {
          success: true,
          name,
          kind,
          data,
        },
        null,
        2
      )
    )
    process.exit(0)
    return
  }

  // Plain text fallback
  const entry = data as Record<string, unknown>

  logger.heading(`${name} (${kind})`)
  logger.blank()

  if (entry.description) {
    logger.info(String(entry.description))
    logger.blank()
  }

  if (Array.isArray(entry.when_to_use) && entry.when_to_use.length > 0) {
    logger.info("When to use:")
    for (const item of entry.when_to_use as string[]) {
      logger.info(`  • ${item}`)
    }
    logger.blank()
  }

  if (entry.example) {
    logger.info("Example:")
    logger.info(String(entry.example))
  }
}
