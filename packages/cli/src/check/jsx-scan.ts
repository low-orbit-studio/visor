import { readFileSync, readdirSync, statSync } from "fs"
import { resolve, extname, join } from "path"
import { NATIVE_TO_VISOR, INPUT_TYPE_MAP } from "./native-map.js"

export interface ScanFinding {
  file: string
  line: number
  column: number
  nativeTag: string
  suggestedPrimitive: string
  installCmd: string
  rationale?: string
}

export interface ScanResult {
  findings: ScanFinding[]
  summary: { scanned: number; hits: number }
}

// Lazy-loaded to avoid paying the import cost for non-diff commands.
async function getBabelParser() {
  const { parse } = await import("@babel/parser")
  return parse
}

function walk(node: unknown, visit: (n: Record<string, unknown>) => void): void {
  if (!node || typeof node !== "object") return
  const obj = node as Record<string, unknown>
  visit(obj)
  for (const key of Object.keys(obj)) {
    if (key === "parent" || key === "tokens" || key === "errors") continue
    const val = obj[key]
    if (Array.isArray(val)) {
      for (const child of val) walk(child, visit)
    } else if (val && typeof val === "object" && "type" in (val as object)) {
      walk(val, visit)
    }
  }
}

function getInputType(attribs: unknown[]): string {
  for (const attr of attribs) {
    const a = attr as Record<string, unknown>
    if (a.type !== "JSXAttribute") continue
    const nameNode = a.name as Record<string, unknown>
    if ((nameNode?.name as string) !== "type") continue
    const valueNode = a.value as Record<string, unknown> | null
    if (!valueNode) continue
    if (valueNode.type === "StringLiteral") {
      return String(valueNode.value ?? "text")
    }
    // JSXExpressionContainer with a string literal value
    if (valueNode.type === "JSXExpressionContainer") {
      const expr = valueNode.expression as Record<string, unknown>
      if (expr?.type === "StringLiteral") return String(expr.value ?? "text")
    }
  }
  return "_default"
}

function collectJsxFindings(
  source: string,
  filePath: string,
  parse: (src: string, opts: object) => unknown
): ScanFinding[] {
  let ast: unknown
  try {
    ast = parse(source, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
      errorRecovery: true,
    })
  } catch {
    return []
  }

  const findings: ScanFinding[] = []

  walk(ast, (node) => {
    if (node.type !== "JSXOpeningElement") return

    const nameNode = node.name as Record<string, unknown>
    if (!nameNode) return

    // Only match lowercase (native HTML) elements
    const tagName =
      nameNode.type === "JSXIdentifier" ? String(nameNode.name ?? "") : ""
    if (!tagName || tagName[0] !== tagName[0].toLowerCase()) return

    const loc = node.loc as Record<string, Record<string, number>> | undefined
    const line = loc?.start?.line ?? 0
    const column = loc?.start?.column ?? 0

    if (tagName === "input") {
      const attribs = (node.attributes as unknown[]) ?? []
      const typeVal = getInputType(attribs)
      const mapping = INPUT_TYPE_MAP[typeVal] ?? INPUT_TYPE_MAP["_default"]
      findings.push({
        file: filePath,
        line,
        column,
        nativeTag: typeVal !== "_default" ? `input[type=${typeVal}]` : "input",
        suggestedPrimitive: mapping.displayName,
        installCmd: `npx visor add ${mapping.visorName}`,
      })
      return
    }

    const mapping = NATIVE_TO_VISOR[tagName]
    if (!mapping) return

    const finding: ScanFinding = {
      file: filePath,
      line,
      column,
      nativeTag: tagName,
      suggestedPrimitive: mapping.displayName,
      installCmd: `npx visor add ${mapping.visorName}`,
    }
    if (mapping.notes) finding.rationale = mapping.notes
    findings.push(finding)
  })

  return findings
}

function collectFiles(pathArg: string): string[] {
  const JSX_EXTS = new Set([".jsx", ".tsx", ".js", ".ts"])
  try {
    const s = statSync(pathArg)
    if (s.isDirectory()) {
      const files: string[] = []
      function recurse(dir: string) {
        for (const entry of readdirSync(dir)) {
          if (entry.startsWith(".") || entry === "node_modules") continue
          const full = join(dir, entry)
          const es = statSync(full)
          if (es.isDirectory()) recurse(full)
          else if (JSX_EXTS.has(extname(full))) files.push(full)
        }
      }
      recurse(pathArg)
      return files
    }
    if (JSX_EXTS.has(extname(pathArg))) return [pathArg]
  } catch {
    // fall through
  }
  return []
}

export async function scanJsx(pathArg: string): Promise<ScanResult> {
  const parse = await getBabelParser()

  let files: string[]
  let stdinMode = false

  if (pathArg === "-") {
    stdinMode = true
    files = ["<stdin>"]
  } else {
    files = collectFiles(resolve(pathArg))
  }

  const allFindings: ScanFinding[] = []

  for (const file of files) {
    let source: string
    if (stdinMode) {
      source = readFileSync(0, "utf-8") // fd 0 = stdin
    } else {
      try {
        source = readFileSync(file, "utf-8")
      } catch {
        continue
      }
    }
    allFindings.push(...collectJsxFindings(source, stdinMode ? "<stdin>" : file, parse))
  }

  return {
    findings: allFindings,
    summary: { scanned: files.length, hits: allFindings.length },
  }
}
