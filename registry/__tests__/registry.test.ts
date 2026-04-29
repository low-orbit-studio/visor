import { describe, it, expect } from "vitest"
import { ui } from "../registry-ui"
import { hooks } from "../registry-hooks"
import { lib } from "../registry-lib"
import { blocks } from "../registry-blocks"
import { devtools } from "../registry-devtools"

describe("Registry", () => {
  describe("ui registry", () => {
    it("has at least one item", () => {
      expect(ui.length).toBeGreaterThan(0)
    })

    it("all items have required fields", () => {
      for (const item of ui) {
        expect(item.name).toBeTruthy()
        expect(item.type).toBe("registry:ui")
        expect(Array.isArray(item.files)).toBe(true)
        expect(item.files.length).toBeGreaterThan(0)
      }
    })

    it("button component is registered", () => {
      const button = ui.find((item) => item.name === "button")
      expect(button).toBeDefined()
      expect(button?.registryDependencies).toContain("utils")
    })
  })

  describe("hooks registry", () => {
    it("has at least one item", () => {
      expect(hooks.length).toBeGreaterThan(0)
    })

    it("all items have required fields", () => {
      for (const item of hooks) {
        expect(item.name).toBeTruthy()
        expect(item.type).toBe("registry:hook")
        expect(Array.isArray(item.files)).toBe(true)
      }
    })
  })

  describe("lib registry", () => {
    it("has at least one item", () => {
      expect(lib.length).toBeGreaterThan(0)
    })

    it("utils is registered", () => {
      const utils = lib.find((item) => item.name === "utils")
      expect(utils).toBeDefined()
      expect(utils?.type).toBe("registry:lib")
    })
  })

  describe("blocks registry", () => {
    it("has at least one item", () => {
      expect(blocks.length).toBeGreaterThan(0)
    })

    it("all items have required fields", () => {
      for (const item of blocks) {
        expect(item.name).toBeTruthy()
        expect(item.type).toBe("registry:block")
        expect(Array.isArray(item.files)).toBe(true)
        expect(item.files.length).toBeGreaterThan(0)
      }
    })

    it("all block files use registry:block type", () => {
      for (const item of blocks) {
        for (const file of item.files) {
          expect(file.type).toBe("registry:block")
        }
      }
    })

    it("design-system-specimen block is registered", () => {
      const specimen = blocks.find(
        (item) => item.name === "design-system-specimen"
      )
      expect(specimen).toBeDefined()
      expect(specimen?.category).toBe("documentation")
      expect(specimen?.registryDependencies).toContain("button")
      expect(specimen?.registryDependencies).toContain("input")
      expect(specimen?.registryDependencies).toContain("utils")
    })

    it("login-form block is registered", () => {
      const placeholder = blocks.find(
        (item) => item.name === "login-form"
      )
      expect(placeholder).toBeDefined()
      expect(placeholder?.category).toBe("authentication")
      expect(placeholder?.registryDependencies).toContain("utils")
    })
  })

  describe("devtools registry", () => {
    it("has at least one item", () => {
      expect(devtools.length).toBeGreaterThan(0)
    })

    it("all items use registry:devtool type and have files", () => {
      for (const item of devtools) {
        expect(item.name).toBeTruthy()
        expect(item.type).toBe("registry:devtool")
        expect(Array.isArray(item.files)).toBe(true)
        expect(item.files.length).toBeGreaterThan(0)
        for (const file of item.files) {
          expect(file.type).toBe("registry:devtool")
        }
      }
    })

    it("source-inspector and source-inspector-toggle are registered", () => {
      const inspector = devtools.find((item) => item.name === "source-inspector")
      const toggle = devtools.find(
        (item) => item.name === "source-inspector-toggle"
      )
      expect(inspector).toBeDefined()
      expect(toggle).toBeDefined()
      expect(toggle?.registryDependencies).toContain("source-inspector")
    })
  })

  describe("theme-switcher", () => {
    it("is registered as a registry:ui component with category general", () => {
      const item = ui.find((entry) => entry.name === "theme-switcher")
      expect(item).toBeDefined()
      expect(item?.type).toBe("registry:ui")
      expect(item?.category).toBe("general")
      expect(item?.files.length).toBe(2)
    })
  })
})
