// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { execFileSync } from 'child_process'
import { doctorCommand } from '../commands/doctor.js'

// child_process is a Node.js built-in that must run in node environment.
// The @vitest-environment node docblock above overrides the workspace-root
// jsdom default so mocking works correctly.
vi.mock('child_process', () => ({ execFileSync: vi.fn() }))

let testDir: string

function makeMinimalProject(dir: string) {
  writeFileSync(join(dir, 'visor.json'), JSON.stringify({ version: 1 }))
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies: { react: '^18.0.0' } }))
}

function captureJsonOutput(logMock: ReturnType<typeof vi.fn>): Record<string, unknown> {
  for (const call of logMock.mock.calls) {
    try {
      return JSON.parse(call[0]) as Record<string, unknown>
    } catch {
      // not JSON, skip
    }
  }
  throw new Error('No JSON output found in console.log calls')
}

beforeEach(() => {
  testDir = join(tmpdir(), `visor-test-doctor-${Date.now()}`)
  mkdirSync(testDir, { recursive: true })
  makeMinimalProject(testDir)
  vi.mocked(execFileSync).mockReset()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code})`)
  }) as never)
})

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

// ============================================================
// stale-global-cli check
// ============================================================

describe('stale-global-cli check', () => {
  it('warns when global binary is older than running CLI', async () => {
    vi.mocked(execFileSync).mockImplementation((cmd: unknown, args: unknown) => {
      const cmdStr = cmd as string
      const argsArr = args as string[]
      if (cmdStr === 'which' && argsArr[0] === 'visor') return '/usr/local/bin/visor'
      if (argsArr[0] === '--version') return '0.1.0'
      throw new Error(`Unexpected execFileSync call: ${cmdStr} ${String(argsArr)}`)
    })

    await expect(doctorCommand(testDir, { json: true }, '0.2.0')).rejects.toThrow('process.exit')

    const result = captureJsonOutput(vi.mocked(console.log))
    const checks = result.checks as Array<Record<string, unknown>>
    const staleCheck = checks.find((c) => c.name === 'stale-global-cli')

    expect(staleCheck).toBeDefined()
    expect(staleCheck?.pass).toBe(false)
    expect(staleCheck?.severity).toBe('warning')
    expect(staleCheck?.fix).toBe('Run npm uninstall -g @loworbitstudio/visor to remove the stale global')
    expect(staleCheck?.message).toContain('0.1.0')
    expect(staleCheck?.message).toContain('0.2.0')
  })

  it('passes when global binary matches running CLI version', async () => {
    vi.mocked(execFileSync).mockImplementation((cmd: unknown, args: unknown) => {
      const cmdStr = cmd as string
      const argsArr = args as string[]
      if (cmdStr === 'which' && argsArr[0] === 'visor') return '/usr/local/bin/visor'
      if (argsArr[0] === '--version') return '0.2.0'
      throw new Error(`Unexpected execFileSync call: ${cmdStr} ${String(argsArr)}`)
    })

    await expect(doctorCommand(testDir, { json: true }, '0.2.0')).rejects.toThrow('process.exit')

    const result = captureJsonOutput(vi.mocked(console.log))
    const checks = result.checks as Array<Record<string, unknown>>
    const staleCheck = checks.find((c) => c.name === 'stale-global-cli')

    expect(staleCheck).toBeDefined()
    expect(staleCheck?.pass).toBe(true)
    expect(staleCheck?.severity).toBe('warning')
  })

  it('passes silently when which throws (no global installed)', async () => {
    vi.mocked(execFileSync).mockImplementation((cmd: unknown, args: unknown) => {
      const argsArr = args as string[]
      if (argsArr[0] === 'visor') throw new Error('not found')
      throw new Error(`Unexpected execFileSync call: ${cmd as string} ${String(argsArr)}`)
    })

    await expect(doctorCommand(testDir, { json: true }, '0.2.0')).rejects.toThrow('process.exit')

    const result = captureJsonOutput(vi.mocked(console.log))
    const checks = result.checks as Array<Record<string, unknown>>
    const staleCheck = checks.find((c) => c.name === 'stale-global-cli')

    expect(staleCheck).toBeUndefined()
  })

  it('passes silently when global binary is unresponsive (--version throws)', async () => {
    vi.mocked(execFileSync).mockImplementation((cmd: unknown, args: unknown) => {
      const cmdStr = cmd as string
      const argsArr = args as string[]
      if (cmdStr === 'which' && argsArr[0] === 'visor') return '/usr/local/bin/visor'
      if (argsArr[0] === '--version') throw new Error('binary unresponsive')
      throw new Error(`Unexpected execFileSync call: ${cmdStr} ${String(argsArr)}`)
    })

    await expect(doctorCommand(testDir, { json: true }, '0.2.0')).rejects.toThrow('process.exit')

    const result = captureJsonOutput(vi.mocked(console.log))
    const checks = result.checks as Array<Record<string, unknown>>
    const staleCheck = checks.find((c) => c.name === 'stale-global-cli')

    expect(staleCheck).toBeUndefined()
  })

  it('skips check entirely on Windows (process.platform === win32)', async () => {
    const execSpy = vi.mocked(execFileSync)
    const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true })

    try {
      execSpy.mockClear()
      await expect(doctorCommand(testDir, { json: true }, '0.2.0')).rejects.toThrow('process.exit')

      const result = captureJsonOutput(vi.mocked(console.log))
      const checks = result.checks as Array<Record<string, unknown>>
      const staleCheck = checks.find((c) => c.name === 'stale-global-cli')

      expect(staleCheck).toBeUndefined()
      expect(execSpy).not.toHaveBeenCalled()
    } finally {
      if (originalPlatform) {
        Object.defineProperty(process, 'platform', originalPlatform)
      }
    }
  })
})
