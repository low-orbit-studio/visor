/**
 * Build Init-Plays Script
 *
 * Emits dist/init-plays.json — the static known-plays table that
 * `visor init --for {play-type}` validates against (VI-596, D2). The
 * source of truth is the per-play definitions aggregated in
 * ../commands/init-plays/registry.ts; this script projects them into a
 * shippable JSON artifact (parallel to build-registry.ts / build-manifest.ts).
 */

import { existsSync, mkdirSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { KNOWN_PLAYS } from "../commands/init-plays/registry.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST_DIR = join(__dirname, "../../dist")

function main(): void {
  console.log("Building init-plays JSON...\n")

  const plays = KNOWN_PLAYS.map((p) => ({
    id: p.id,
    loSubdir: p.loSubdir,
    label: p.label,
    description: p.description,
  }))

  if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true })
  }

  const outputPath = join(DIST_DIR, "init-plays.json")
  writeFileSync(outputPath, JSON.stringify({ plays }, null, 2) + "\n", "utf-8")

  for (const p of plays) console.log(`  ✓ ${p.id} → .lo/${p.loSubdir}/`)
  console.log(`\n✓ Built init-plays with ${plays.length} plays`)
  console.log(`✓ Written to ${outputPath}`)
}

main()
