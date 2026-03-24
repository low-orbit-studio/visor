import { describe, it, expect } from "vitest"
import { existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { ui } from "../../../registry/registry-ui"

const __dirname = dirname(fileURLToPath(import.meta.url))
const COMPONENTS_DIR = join(__dirname, "..")

describe("visor.yaml coverage", () => {
  const componentNames = ui.map((item) => item.name)

  it.each(componentNames)("%s has a .visor.yaml metadata file", (name) => {
    const yamlPath = join(COMPONENTS_DIR, name, `${name}.visor.yaml`)
    expect(existsSync(yamlPath)).toBe(true)
  })
})
