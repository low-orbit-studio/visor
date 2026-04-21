/**
 * Flutter widget registry.
 *
 * Unlike the hand-authored React registries, this module auto-derives items
 * from each widget's `*.visor.yaml` manifest in `components/flutter/<name>/`.
 * The manifest is the single source of truth for a Flutter widget's
 * metadata (name, description, category, files, pubDependencies); we do not
 * want to duplicate that in a parallel TypeScript array.
 */

import { readdirSync, readFileSync, existsSync, statSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { parse as parseYAML } from "yaml"
import type { Registry, RegistryItem, PubDependency } from "./schema.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, "..")
const FLUTTER_DIR = join(REPO_ROOT, "components", "flutter")

interface FlutterManifest {
  name?: unknown
  description?: unknown
  category?: unknown
  files?: unknown
  pubDependencies?: unknown
}

function normalizePubDep(entry: unknown): PubDependency | null {
  if (!entry || typeof entry !== "object") return null
  const rec = entry as Record<string, unknown>
  if (typeof rec.pub !== "string" || typeof rec.version !== "string") {
    return null
  }
  return { pub: rec.pub, version: rec.version }
}

function loadManifests(): RegistryItem[] {
  if (!existsSync(FLUTTER_DIR)) return []

  const items: RegistryItem[] = []
  for (const entry of readdirSync(FLUTTER_DIR)) {
    const dir = join(FLUTTER_DIR, entry)
    if (!statSync(dir).isDirectory()) continue

    const manifestPath = join(dir, `${entry}.visor.yaml`)
    if (!existsSync(manifestPath)) continue

    let doc: FlutterManifest
    try {
      doc = parseYAML(readFileSync(manifestPath, "utf-8")) as FlutterManifest
    } catch {
      continue
    }

    if (typeof doc.name !== "string") continue
    if (!Array.isArray(doc.files)) continue

    const pubDeps = Array.isArray(doc.pubDependencies)
      ? (doc.pubDependencies
          .map(normalizePubDep)
          .filter((d): d is PubDependency => d !== null))
      : []

    const item: RegistryItem = {
      name: doc.name,
      type: "registry:ui",
      target: "flutter",
      files: doc.files
        .filter((f): f is string => typeof f === "string")
        .map((path) => ({
          path,
          type: "registry:ui" as const,
          target: "flutter",
        })),
    }

    if (typeof doc.description === "string") {
      item.description = doc.description
    }
    if (typeof doc.category === "string") {
      item.category = doc.category
    }
    if (pubDeps.length > 0) {
      item.pubDependencies = pubDeps
    }

    items.push(item)
  }

  return items
}

export const flutter: Registry = loadManifests()
