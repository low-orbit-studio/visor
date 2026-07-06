import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { patternBuildPlay } from "./pattern-build.js"
import { newWebAppPlay } from "./new-web-app.js"
import { featureAdditionPlay } from "./feature-addition.js"

/**
 * The initial set of Playbook plays Visor's scaffold knows how to bootstrap.
 *
 * D2 (VI-596): the play-type registry is Playbook-owned. Visor ships this as a
 * STATIC table kept in sync with the Playbook's `plays/` directory by
 * convention — it does NOT dynamically discover plays from a Playbook install.
 * An unknown `--for` value errors with the known-plays list (see `getPlay`).
 */
export type PlayType = "pattern-build" | "new-web-app" | "feature-addition"

/**
 * A known play. `loSubdir` is the `.lo/` sub-directory the play's state file
 * lives under (D5 — Visor writes only this play-specific subdirectory).
 */
export interface PlayDefinition {
  /** The `--for` value, e.g. `pattern-build`. */
  readonly id: PlayType
  /** `.lo/` subdirectory (pluralized), e.g. `pattern-builds`. */
  readonly loSubdir: string
  /** Human-facing label for output, e.g. `Pattern build`. */
  readonly label: string
  /** One-line description shown in the known-plays list and errors. */
  readonly description: string
}

/**
 * The play-specific state file Visor writes at init (D5). `phase: 0` marks the
 * play as entered but not yet advanced — semantic phase content is owned by the
 * play itself, not the scaffold.
 */
export interface PlayState {
  play: PlayType
  name: string
  phase: number
  theme?: string
  from?: string
  devPort?: number
  portSource?: "lo-ports" | "fallback"
  createdWith: string
  createdAt: string
}

/** Source of truth for the known-plays table (emitted to dist/init-plays.json). */
export const KNOWN_PLAYS: readonly PlayDefinition[] = [
  patternBuildPlay,
  newWebAppPlay,
  featureAdditionPlay,
]

/** Resolve a play by its `--for` id, or `undefined` if unknown. */
export function getPlay(id: string): PlayDefinition | undefined {
  return KNOWN_PLAYS.find((p) => p.id === id)
}

/** The known `--for` ids, in registry order — for error messages and docs. */
export function knownPlayIds(): string[] {
  return KNOWN_PLAYS.map((p) => p.id)
}

/** Absolute + repo-relative paths for a play instance's state file. */
export function playStatePaths(
  cwd: string,
  def: PlayDefinition,
  name: string
): { dir: string; statePath: string; relStatePath: string } {
  const relDir = join(".lo", def.loSubdir, name)
  const dir = join(cwd, relDir)
  return {
    dir,
    statePath: join(dir, "state.json"),
    relStatePath: join(relDir, "state.json"),
  }
}

/** Read an existing play state file, or `null` if it does not exist / is unreadable. */
export function readPlayState(statePath: string): PlayState | null {
  if (!existsSync(statePath)) return null
  try {
    return JSON.parse(readFileSync(statePath, "utf-8")) as PlayState
  } catch {
    return null
  }
}

/** Write a play state file (structural write only — creates parent dirs). */
export function writePlayState(statePath: string, state: PlayState): void {
  mkdirSync(dirname(statePath), { recursive: true })
  writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n", "utf-8")
}
