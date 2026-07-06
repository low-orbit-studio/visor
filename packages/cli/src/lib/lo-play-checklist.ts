import { existsSync, readFileSync } from "fs"
import { homedir } from "os"
import { join } from "path"

/**
 * Entry-checklist bridge for `visor init --for` (D6, VI-596).
 *
 * After bootstrapping a play, Visor prints the play's next-phase checklist,
 * read from the Playbook's canonical skill location:
 *
 *   ~/.claude/skills/lo-play/{play-type}/entry-checklist.md
 *
 * If the checklist file is missing (e.g. the companion Playbook change hasn't
 * landed on this machine), `readEntryChecklist` returns a `found: false` result
 * with a clear fallback message rather than failing the init.
 */

/** Default root that holds per-play `entry-checklist.md` files. */
export function defaultChecklistRoot(): string {
  return join(homedir(), ".claude", "skills", "lo-play")
}

export interface ChecklistFound {
  found: true
  /** Absolute path the checklist was read from. */
  path: string
  /** Raw markdown contents of the checklist. */
  content: string
}

export interface ChecklistMissing {
  found: false
  /** Absolute path that was checked. */
  path: string
  /** Operator-facing message explaining how to proceed manually. */
  fallbackMessage: string
}

export type ChecklistResult = ChecklistFound | ChecklistMissing

export interface ReadChecklistOptions {
  /** Override the checklist root (used in tests). */
  root?: string
}

export function readEntryChecklist(
  playType: string,
  options: ReadChecklistOptions = {}
): ChecklistResult {
  const root = options.root ?? defaultChecklistRoot()
  const path = join(root, playType, "entry-checklist.md")

  if (!existsSync(path)) {
    return {
      found: false,
      path,
      fallbackMessage:
        `Entry checklist not found at ${path}. ` +
        `Run the play manually from \`/lo-play ${playType}\`.`,
    }
  }

  try {
    return { found: true, path, content: readFileSync(path, "utf-8") }
  } catch {
    return {
      found: false,
      path,
      fallbackMessage:
        `Entry checklist at ${path} could not be read. ` +
        `Run the play manually from \`/lo-play ${playType}\`.`,
    }
  }
}
