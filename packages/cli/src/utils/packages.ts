import { execFileSync } from "child_process"
import { existsSync, readFileSync } from "fs"
import { join } from "path"

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

function readPackageJson(cwd: string): PackageJson | null {
  const pkgPath = join(cwd, "package.json")
  if (!existsSync(pkgPath)) return null
  return JSON.parse(readFileSync(pkgPath, "utf-8")) as PackageJson
}

export function isPackageInstalled(
  packageName: string,
  cwd: string
): boolean {
  const pkg = readPackageJson(cwd)
  if (!pkg) return false
  return !!(
    pkg.dependencies?.[packageName] || pkg.devDependencies?.[packageName]
  )
}

export function hasVisorTokens(cwd: string): boolean {
  return isPackageInstalled("@loworbitstudio/visor", cwd)
}

export function getUninstalledDeps(
  dependencies: string[],
  cwd: string
): string[] {
  return dependencies.filter((dep) => !isPackageInstalled(dep, cwd))
}

export function installPackages(
  packages: string[],
  cwd: string,
  dev = false
): boolean {
  if (packages.length === 0) return true
  const args = ["install", dev ? "--save-dev" : "--save", ...packages]
  try {
    execFileSync("npm", args, { cwd, stdio: "inherit" })
    return true
  } catch {
    return false
  }
}
