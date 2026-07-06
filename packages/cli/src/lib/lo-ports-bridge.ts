import * as childProcess from "child_process"

/**
 * Port allocation bridge for `visor init --for` (D4, VI-596).
 *
 * Preferred path: shell out to a `lo-ports` command so the Playbook's port
 * registry stays the single source of truth — Visor never reimplements block
 * allocation. If that command is unavailable (no Playbook install, or the
 * `/lo-ports` skill has no non-interactive entry point on this machine), fall
 * back to a heuristic port in a fixed range and surface a warning so the
 * operator can register the port with `/lo-ports` later.
 */

const LO_PORTS_COMMAND = "lo-ports"
const LO_PORTS_ARGS = ["next", "--json"]
const FALLBACK_RANGE_START = 4200
const FALLBACK_RANGE_SIZE = 100

export type PortSource = "lo-ports" | "fallback"

export interface AllocatePortResult {
  port: number
  source: PortSource
  /** Present only on the fallback path — explains why /lo-ports was not used. */
  warning?: string
}

/**
 * Runs `lo-ports next --json`. Returns the raw stdout on success, or `null` if
 * the command is unavailable or exits non-zero. Never throws.
 */
export type CommandRunner = () => string | null

export interface AllocatePortOptions {
  /** Override the /lo-ports shell-out (used in tests). */
  runCommand?: CommandRunner
}

/**
 * Allocate a dev port for a play. Tries `/lo-ports` first, then a heuristic in
 * the fallback range. The `source` field tells callers which path was taken so
 * they can surface `(via /lo-ports)` vs. the fallback warning. The fallback is
 * deterministic per `name`, so it is stable across re-runs.
 */
export function allocatePort(
  name: string,
  options: AllocatePortOptions = {}
): AllocatePortResult {
  const runCommand = options.runCommand ?? defaultRunCommand

  const stdout = safeRun(runCommand)
  const fromRegistry = stdout != null ? parsePort(stdout) : null
  if (fromRegistry != null) {
    return { port: fromRegistry, source: "lo-ports" }
  }

  const port = heuristicPort(name)
  return {
    port,
    source: "fallback",
    warning:
      `Could not allocate a dev port via /lo-ports (no \`${LO_PORTS_COMMAND}\` command found). ` +
      `Used heuristic port ${port} instead — register it with \`/lo-ports\` when convenient.`,
  }
}

function safeRun(runCommand: CommandRunner): string | null {
  try {
    return runCommand()
  } catch {
    return null
  }
}

function defaultRunCommand(): string | null {
  const result = childProcess.spawnSync(LO_PORTS_COMMAND, LO_PORTS_ARGS, {
    encoding: "utf-8",
  })
  if (result.error) return null
  if (typeof result.status === "number" && result.status !== 0) return null
  return result.stdout ?? null
}

/**
 * Parse a port from `lo-ports` output. Accepts either a JSON object with a
 * `port` field or a bare number on its own line — tolerant of whatever a future
 * `lo-ports next` entry point emits.
 */
function parsePort(stdout: string): number | null {
  const trimmed = stdout.trim()
  if (trimmed.length === 0) return null
  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (typeof parsed === "number" && isValidPort(parsed)) return parsed
    if (
      parsed != null &&
      typeof parsed === "object" &&
      "port" in parsed &&
      isValidPort((parsed as { port: unknown }).port)
    ) {
      return (parsed as { port: number }).port
    }
  } catch {
    // not JSON — fall through to bare-number parsing
  }
  const bare = Number(trimmed)
  return isValidPort(bare) ? bare : null
}

function isValidPort(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 && value < 65536
}

/** Deterministic heuristic port in [FALLBACK_RANGE_START, +SIZE), stable per name. */
function heuristicPort(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return FALLBACK_RANGE_START + (hash % FALLBACK_RANGE_SIZE)
}
