import { describe, it, expect } from "vitest"
import { existsSync } from "fs"
import { join } from "path"
import { ui } from "../../../registry/registry-ui"

const COMPONENTS_DIR = join(process.cwd(), "components/ui")

describe("visor.yaml coverage", () => {
  const componentNames = ui.map((item) => item.name)

  it.each(componentNames)("%s has a .visor.yaml metadata file", (name) => {
    const yamlPath = join(COMPONENTS_DIR, name, `${name}.visor.yaml`)
    expect(existsSync(yamlPath)).toBe(true)
  })
})
