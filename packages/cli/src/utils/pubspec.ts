import { existsSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { parseDocument, YAMLMap } from "yaml"
import type { PubDependency } from "../registry/types.js"

interface MergePubspecResult {
  text: string
  added: string[]
  skipped: string[]
}

export function mergePubspec(
  pubspecText: string,
  deps: PubDependency[]
): MergePubspecResult {
  const doc = parseDocument(pubspecText)
  const added: string[] = []
  const skipped: string[] = []

  let depsNode = doc.get("dependencies") as YAMLMap | null
  if (depsNode == null || !(depsNode instanceof YAMLMap)) {
    depsNode = new YAMLMap()
    doc.set("dependencies", depsNode)
  }

  for (const dep of deps) {
    if (depsNode.has(dep.pub)) {
      skipped.push(dep.pub)
      continue
    }
    depsNode.set(dep.pub, dep.version)
    added.push(dep.pub)
  }

  return { text: doc.toString(), added, skipped }
}

export function pubspecPath(cwd: string): string {
  return join(cwd, "pubspec.yaml")
}

export function pubspecExists(cwd: string): boolean {
  return existsSync(pubspecPath(cwd))
}

export function isPubPackageInstalled(
  packageName: string,
  cwd: string
): boolean {
  if (!pubspecExists(cwd)) return false
  const text = readFileSync(pubspecPath(cwd), "utf-8")
  const doc = parseDocument(text)
  const depsNode = doc.get("dependencies")
  if (!(depsNode instanceof YAMLMap)) return false
  return depsNode.has(packageName)
}

export function getUninstalledPubDeps(
  deps: PubDependency[],
  cwd: string
): PubDependency[] {
  return deps.filter((d) => !isPubPackageInstalled(d.pub, cwd))
}

export function addPubDependencies(
  deps: PubDependency[],
  cwd: string
): MergePubspecResult {
  const path = pubspecPath(cwd)
  if (!existsSync(path)) {
    throw new Error(
      `No pubspec.yaml found at ${path}. Run this command from a Flutter project root.`
    )
  }
  const text = readFileSync(path, "utf-8")
  const result = mergePubspec(text, deps)
  if (result.added.length > 0) {
    writeFileSync(path, result.text, "utf-8")
  }
  return result
}
