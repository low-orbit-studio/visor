import * as fs from 'fs'
import * as path from 'path'
import { execFileSync } from 'child_process'

interface Check {
  name: string
  pass: boolean
  severity: 'error' | 'warning' | 'info'
  message: string
  fix?: string
}

interface DoctorResult {
  status: 'ok' | 'warning' | 'error'
  checks: Check[]
}

export async function doctorCommand(cwd: string, options: { json?: boolean }, cliVersion: string): Promise<void> {
  const checks: Check[] = []

  // Check 1: visor.json exists and is valid JSON
  const visorJsonPath = path.join(cwd, 'visor.json')
  try {
    const content = fs.readFileSync(visorJsonPath, 'utf-8')
    JSON.parse(content)
    checks.push({ name: 'visor.json', pass: true, severity: 'error', message: 'visor.json exists and is valid JSON' })
  } catch {
    checks.push({
      name: 'visor.json',
      pass: false,
      severity: 'error',
      message: 'visor.json missing or invalid',
      fix: 'Run `npx visor init` to initialize Visor in this project',
    })
  }

  // Check 2: @loworbitstudio/visor-core installed
  const visorCorePath = path.join(cwd, 'node_modules', '@loworbitstudio', 'visor-core')
  if (fs.existsSync(visorCorePath)) {
    checks.push({ name: 'visor-core', pass: true, severity: 'error', message: '@loworbitstudio/visor-core is installed' })
  } else {
    checks.push({
      name: 'visor-core',
      pass: false,
      severity: 'error',
      message: '@loworbitstudio/visor-core not found in node_modules',
      fix: 'Run `npm install @loworbitstudio/visor-core`',
    })
  }

  // Check 3: CSS import present (scan for @import of visor-core in CSS files)
  const cssFiles = findCssFiles(cwd)
  const hasVisorImport = cssFiles.some((f) => {
    try {
      const content = fs.readFileSync(f, 'utf-8')
      return content.includes('visor-core') || content.includes('@loworbitstudio/visor-core')
    } catch {
      return false
    }
  })
  if (hasVisorImport) {
    checks.push({ name: 'css-import', pass: true, severity: 'warning', message: 'visor-core CSS import found' })
  } else {
    checks.push({
      name: 'css-import',
      pass: false,
      severity: 'warning',
      message: 'No visor-core CSS import found in CSS files',
      fix: 'Add `@import "@loworbitstudio/visor-core/tokens.css"` to your global CSS file',
    })
  }

  // Check 4: Peer deps satisfied (React >=17)
  const pkgJsonPath = path.join(cwd, 'package.json')
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const reactVersion = pkg.dependencies?.react ?? pkg.devDependencies?.react ?? ''
    const versionNum = parseFloat(reactVersion.replace(/[^0-9.]/g, ''))
    if (!reactVersion) {
      checks.push({
        name: 'react-version',
        pass: false,
        severity: 'error',
        message: 'React not found in dependencies',
        fix: 'Install React: `npm install react@latest react-dom@latest`',
      })
    } else if (versionNum >= 17 || reactVersion.includes('18') || reactVersion.includes('19')) {
      checks.push({ name: 'react-version', pass: true, severity: 'error', message: `React ${reactVersion} satisfies peer dep requirement (>=17)` })
    } else {
      checks.push({
        name: 'react-version',
        pass: false,
        severity: 'error',
        message: `React version ${reactVersion} may not satisfy peer dep requirement (>=17)`,
        fix: 'Upgrade React to v17 or higher: `npm install react@latest react-dom@latest`',
      })
    }
  } catch {
    checks.push({
      name: 'react-version',
      pass: false,
      severity: 'warning',
      message: 'Could not read package.json to check React version',
      fix: 'Ensure package.json exists in the project root',
    })
  }

  // Check 5: At least one component directory exists under components/ui/
  const componentsDir = path.join(cwd, 'components', 'ui')
  if (fs.existsSync(componentsDir) && fs.readdirSync(componentsDir).length > 0) {
    const count = fs.readdirSync(componentsDir).length
    checks.push({ name: 'components', pass: true, severity: 'info', message: `${count} component(s) found under components/ui/` })
  } else {
    checks.push({
      name: 'components',
      pass: false,
      severity: 'info',
      message: 'No components found under components/ui/',
      fix: 'Add components with `npx visor add <component-name>` (e.g. `npx visor add button`)',
    })
  }

  // Check 6: Registry manifest present and non-empty
  const manifestPaths = [
    path.join(cwd, 'public', 'r', 'index.json'),
    path.join(cwd, 'registry', 'index.json'),
  ]
  const foundManifest = manifestPaths.find((p) => fs.existsSync(p))
  if (foundManifest) {
    try {
      const manifestContent = JSON.parse(fs.readFileSync(foundManifest, 'utf-8')) as unknown
      const isEmpty =
        manifestContent === null ||
        (Array.isArray(manifestContent) && manifestContent.length === 0) ||
        (typeof manifestContent === 'object' && Object.keys(manifestContent as object).length === 0)
      if (!isEmpty) {
        checks.push({ name: 'registry-manifest', pass: true, severity: 'info', message: `Registry manifest found at ${path.relative(cwd, foundManifest)}` })
      } else {
        checks.push({
          name: 'registry-manifest',
          pass: false,
          severity: 'info',
          message: 'Registry manifest is empty',
          fix: 'Run `npx visor build` to regenerate the registry manifest',
        })
      }
    } catch {
      checks.push({
        name: 'registry-manifest',
        pass: false,
        severity: 'info',
        message: 'Registry manifest found but could not be parsed',
        fix: 'Run `npx visor build` to regenerate the registry manifest',
      })
    }
  } else {
    checks.push({
      name: 'registry-manifest',
      pass: false,
      severity: 'info',
      message: 'No registry manifest found (this is normal for consumer projects)',
      fix: 'If building a design system, run `npx visor build` to generate the registry manifest',
    })
  }

  // Check 7: Stale global visor CLI
  if (process.platform !== 'win32') {
    try {
      const globalPath = execFileSync('which', ['visor'], { encoding: 'utf-8' }).trim()
      if (globalPath) {
        const globalVersionRaw = execFileSync(globalPath, ['--version'], { encoding: 'utf-8' }).trim()
        const globalVersion = globalVersionRaw.split(/\s+/).pop() ?? ''
        if (isOlder(globalVersion, cliVersion)) {
          checks.push({
            name: 'stale-global-cli',
            pass: false,
            severity: 'warning',
            message: `Global visor ${globalVersion} is older than running CLI ${cliVersion}`,
            fix: 'Run npm uninstall -g @loworbitstudio/visor to remove the stale global',
          })
        } else {
          checks.push({
            name: 'stale-global-cli',
            pass: true,
            severity: 'warning',
            message: `Global visor ${globalVersion} matches running CLI`,
          })
        }
      }
    } catch {
      // No global installed or binary unresponsive → silent pass (no false positives)
    }
  }

  // Calculate overall status
  const hasErrors = checks.some((c) => !c.pass && c.severity === 'error')
  const hasWarnings = checks.some((c) => !c.pass && c.severity === 'warning')
  const result: DoctorResult = {
    status: hasErrors ? 'error' : hasWarnings ? 'warning' : 'ok',
    checks,
  }

  if (options.json) {
    console.log(JSON.stringify(result, null, 2))
    process.exit(hasErrors ? 1 : 0)
    return
  }

  // Human-readable output
  console.log('\nVisor Doctor\n============')
  for (const check of checks) {
    const icon = check.pass ? '✓' : check.severity === 'error' ? '✗' : '⚠'
    console.log(`${icon} ${check.name}: ${check.message}`)
    if (!check.pass && check.fix) {
      console.log(`  Fix: ${check.fix}`)
    }
  }
  console.log(`\nStatus: ${result.status.toUpperCase()}`)
  process.exit(hasErrors ? 1 : 0)
}

function isOlder(a: string, b: string): boolean {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0)
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const va = pa[i] ?? 0
    const vb = pb[i] ?? 0
    if (va < vb) return true
    if (va > vb) return false
  }
  return false
}

function findCssFiles(dir: string, maxDepth = 3): string[] {
  const files: string[] = []
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      const fullPath = path.join(dir, entry.name)
      if (entry.isFile() && (entry.name.endsWith('.css') || entry.name.endsWith('.scss'))) {
        files.push(fullPath)
      } else if (entry.isDirectory() && maxDepth > 0) {
        files.push(...findCssFiles(fullPath, maxDepth - 1))
      }
    }
  } catch { /* ignore */ }
  return files
}
