import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdirSync, rmSync, writeFileSync, chmodSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { findFlutterBin } from "../utils/flutter.js"

let testHome: string
let testPath: string

beforeEach(() => {
  const root = join(tmpdir(), `visor-test-flutter-${Date.now()}-${Math.random()}`)
  testHome = join(root, "home")
  testPath = join(root, "bin")
  mkdirSync(testHome, { recursive: true })
  mkdirSync(testPath, { recursive: true })
})

afterEach(() => {
  rmSync(join(testHome, ".."), { recursive: true, force: true })
})

function makeFlutterStub(dir: string, name = "flutter") {
  mkdirSync(dir, { recursive: true })
  const path = join(dir, name)
  writeFileSync(path, "#!/bin/sh\necho flutter-stub\n")
  chmodSync(path, 0o755)
  return path
}

describe("findFlutterBin", () => {
  it("returns null when no flutter found anywhere", () => {
    const result = findFlutterBin({
      env: { PATH: testPath },
      home: testHome,
    })
    expect(result).toBeNull()
  })

  it("finds flutter via FLUTTER_ROOT when set", () => {
    const flutterRoot = join(testHome, "custom-flutter")
    const expected = makeFlutterStub(join(flutterRoot, "bin"))
    const result = findFlutterBin({
      env: { FLUTTER_ROOT: flutterRoot, PATH: testPath },
      home: testHome,
    })
    expect(result).toBe(expected)
  })

  it("finds flutter on PATH", () => {
    const expected = makeFlutterStub(testPath)
    const result = findFlutterBin({
      env: { PATH: testPath },
      home: testHome,
    })
    expect(result).toBe(expected)
  })

  it("prefers PATH over FVM", () => {
    const onPath = makeFlutterStub(testPath)
    makeFlutterStub(join(testHome, "fvm", "versions", "3.35.5", "bin"))
    const result = findFlutterBin({
      env: { PATH: testPath },
      home: testHome,
    })
    expect(result).toBe(onPath)
  })

  it("prefers FLUTTER_ROOT over PATH", () => {
    const flutterRoot = join(testHome, "custom-flutter")
    const rootBin = makeFlutterStub(join(flutterRoot, "bin"))
    makeFlutterStub(testPath)
    const result = findFlutterBin({
      env: { FLUTTER_ROOT: flutterRoot, PATH: testPath },
      home: testHome,
    })
    expect(result).toBe(rootBin)
  })

  it("falls back to FVM default when PATH misses", () => {
    const expected = makeFlutterStub(
      join(testHome, "fvm", "default", "bin")
    )
    const result = findFlutterBin({
      env: { PATH: testPath },
      home: testHome,
    })
    expect(result).toBe(expected)
  })

  it("falls back to highest FVM version when default absent", () => {
    makeFlutterStub(join(testHome, "fvm", "versions", "3.24.0", "bin"))
    const higher = makeFlutterStub(
      join(testHome, "fvm", "versions", "3.35.5", "bin")
    )
    makeFlutterStub(join(testHome, "fvm", "versions", "3.19.0", "bin"))
    const result = findFlutterBin({
      env: { PATH: testPath },
      home: testHome,
    })
    expect(result).toBe(higher)
  })
})
