import { describe, it, expect } from "vitest"
import { ui } from "../registry-ui"
import { hooks } from "../registry-hooks"
import { lib } from "../registry-lib"
import { blocks } from "../registry-blocks"

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

    it("login-form-placeholder block is registered", () => {
      const placeholder = blocks.find(
        (item) => item.name === "login-form-placeholder"
      )
      expect(placeholder).toBeDefined()
      expect(placeholder?.category).toBe("authentication")
      expect(placeholder?.registryDependencies).toContain("utils")
    })
  })
})
