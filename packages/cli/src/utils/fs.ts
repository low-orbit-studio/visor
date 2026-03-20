import {
  writeFileSync,
  readFileSync,
  existsSync,
  mkdirSync,
} from "fs"
import { dirname, join } from "path"
import type { VisorConfig } from "../config/defaults.js"
import type { RegistryItemType } from "../registry/types.js"

/**
 * Maps a registry file path to the consumer's project path using visor.json config.
 *
 * Strips the source prefix and prepends the config path:
 *   components/ui/button/button.tsx → {paths.components}/button/button.tsx
 *   hooks/use-media-query.ts → {paths.hooks}/use-media-query.ts
 *   lib/utils.ts → {paths.lib}/utils.ts
 */
export function resolveOutputPath(
  registryPath: string,
  type: RegistryItemType,
  config: VisorConfig,
  cwd: string
): string {
  let relativePath: string

  if (type === "registry:ui") {
    // Strip "components/ui/" prefix
    relativePath = registryPath.replace(/^components\/ui\//, "")
    return join(cwd, config.paths.components, relativePath)
  }

  if (type === "registry:hook") {
    // Strip "hooks/" prefix
    relativePath = registryPath.replace(/^hooks\//, "")
    return join(cwd, config.paths.hooks, relativePath)
  }

  if (type === "registry:lib") {
    // Strip "lib/" prefix
    relativePath = registryPath.replace(/^lib\//, "")
    return join(cwd, config.paths.lib, relativePath)
  }

  // Fallback: use as-is relative to cwd
  return join(cwd, registryPath)
}

export function writeFile(filePath: string, content: string): void {
  const dir = dirname(filePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(filePath, content, "utf-8")
}

export function readFile(filePath: string): string | null {
  if (!existsSync(filePath)) return null
  return readFileSync(filePath, "utf-8")
}

export function fileExists(filePath: string): boolean {
  return existsSync(filePath)
}
