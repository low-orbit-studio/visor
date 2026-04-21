import { execFileSync } from "child_process"
import { existsSync, readdirSync, statSync } from "fs"
import { homedir } from "os"
import { join } from "path"

export interface FindFlutterOptions {
  env?: NodeJS.ProcessEnv
  home?: string
}

function isExecutable(path: string): boolean {
  try {
    const s = statSync(path)
    return s.isFile()
  } catch {
    return false
  }
}

function fromPath(env: NodeJS.ProcessEnv): string | null {
  const pathVar = env.PATH ?? ""
  const sep = process.platform === "win32" ? ";" : ":"
  const bin = process.platform === "win32" ? "flutter.bat" : "flutter"
  for (const dir of pathVar.split(sep)) {
    if (!dir) continue
    const candidate = join(dir, bin)
    if (isExecutable(candidate)) return candidate
  }
  return null
}

function fromFvm(home: string): string | null {
  const fvmDefault = join(home, "fvm", "default", "bin", "flutter")
  if (isExecutable(fvmDefault)) return fvmDefault

  const versionsDir = join(home, "fvm", "versions")
  if (!existsSync(versionsDir)) return null

  let best: { version: string; path: string } | null = null
  try {
    for (const name of readdirSync(versionsDir)) {
      const candidate = join(versionsDir, name, "bin", "flutter")
      if (!isExecutable(candidate)) continue
      if (!best || compareSemver(name, best.version) > 0) {
        best = { version: name, path: candidate }
      }
    }
  } catch {
    return null
  }
  return best?.path ?? null
}

function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map((x) => parseInt(x, 10) || 0)
  const pb = b.split(".").map((x) => parseInt(x, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const av = pa[i] ?? 0
    const bv = pb[i] ?? 0
    if (av !== bv) return av - bv
  }
  return 0
}

export function findFlutterBin(options: FindFlutterOptions = {}): string | null {
  const env = options.env ?? process.env
  const home = options.home ?? homedir()

  const envRoot = env.FLUTTER_ROOT
  if (envRoot) {
    const bin = join(envRoot, "bin", "flutter")
    if (isExecutable(bin)) return bin
  }

  const fromPathBin = fromPath(env)
  if (fromPathBin) return fromPathBin

  return fromFvm(home)
}

export function runFlutterPubGet(cwd: string, bin: string): boolean {
  try {
    execFileSync(bin, ["pub", "get"], { cwd, stdio: "inherit" })
    return true
  } catch {
    return false
  }
}
