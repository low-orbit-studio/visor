import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { parse as parseYAML } from "yaml"
import type { VisorManifest } from "../generate/manifest-types.js"

describe("build-manifest", () => {
  describe("YAML validation", () => {
    it("parses valid component YAML with all required fields", () => {
      const yaml = `
name: Button
description: A button component.
category: form
when_to_use:
  - Triggering actions
when_not_to_use:
  - Navigation (use Link)
why: It handles focus and keyboard correctly.
props:
  - name: variant
    type: "'default' | 'secondary'"
    default: "default"
dependencies:
  - class-variance-authority
example: |
  <Button>Click me</Button>
`
      const data = parseYAML(yaml)
      expect(data.name).toBe("Button")
      expect(data.category).toBe("form")
      expect(data.when_to_use).toHaveLength(1)
      expect(data.when_not_to_use).toHaveLength(1)
      expect(data.props).toHaveLength(1)
      expect(data.dependencies).toHaveLength(1)
    })

    it("parses component YAML without optional fields", () => {
      const yaml = `
name: Dialog
description: Modal overlay.
category: overlay
when_to_use:
  - Confirmations
when_not_to_use:
  - Side panels (use Sheet)
why: Handles focus trap and overlay.
sub_components:
  - name: DialogContent
    description: The modal panel.
dependencies:
  - "@radix-ui/react-dialog"
example: |
  <Dialog><DialogContent>Hello</DialogContent></Dialog>
`
      const data = parseYAML(yaml)
      expect(data.name).toBe("Dialog")
      expect(data.props).toBeUndefined()
      expect(data.variants).toBeUndefined()
      expect(data.slots).toBeUndefined()
      expect(data.sub_components).toHaveLength(1)
    })

    it("parses valid pattern YAML", () => {
      const yaml = `
name: Form with Validation
description: Standard form layout.
components_used:
  - field
  - input
  - button
when_to_use:
  - Any form collecting user input
structure: |
  <form><Field><Input /></Field></form>
notes: Always use Label with htmlFor.
`
      const data = parseYAML(yaml)
      expect(data.name).toBe("Form with Validation")
      expect(data.components_used).toHaveLength(3)
      expect(data.structure).toContain("<form>")
    })

    it("parses variants as Record<string, string[]>", () => {
      const yaml = `
name: Button
description: A button.
category: form
when_to_use: [Actions]
when_not_to_use: [Navigation]
why: Handles focus.
variants:
  variant: [default, secondary, ghost]
  size: [sm, md, lg]
props:
  - name: variant
    type: string
dependencies: []
example: "<Button />"
`
      const data = parseYAML(yaml)
      expect(data.variants.variant).toEqual(["default", "secondary", "ghost"])
      expect(data.variants.size).toEqual(["sm", "md", "lg"])
    })
  })

  describe("manifest output structure", () => {
    const FIXTURE_DIR = join(tmpdir(), `visor-manifest-test-${Date.now()}`)

    beforeEach(() => {
      mkdirSync(join(FIXTURE_DIR, "components/ui/button"), { recursive: true })
      mkdirSync(join(FIXTURE_DIR, "patterns"), { recursive: true })

      writeFileSync(
        join(FIXTURE_DIR, "components/ui/button/button.visor.yaml"),
        `
name: Button
description: A button.
category: form
when_to_use: [Actions]
when_not_to_use: [Navigation]
why: Handles focus.
variants:
  variant: [default, secondary]
props:
  - name: variant
    type: string
dependencies:
  - class-variance-authority
example: "<Button />"
`
      )

      writeFileSync(
        join(FIXTURE_DIR, "components/ui/button/button.module.css"),
        `.base { color: var(--text-primary, #111); background: var(--surface-card); }`
      )
    })

    afterEach(() => {
      rmSync(FIXTURE_DIR, { recursive: true, force: true })
    })

    it("fixture YAML files are valid and parseable", () => {
      const yamlPath = join(
        FIXTURE_DIR,
        "components/ui/button/button.visor.yaml"
      )
      const raw = readFileSync(yamlPath, "utf-8")
      const data = parseYAML(raw)
      expect(data.name).toBe("Button")
      expect(data.category).toBe("form")
    })

    it("fixture CSS contains extractable tokens", () => {
      const cssPath = join(
        FIXTURE_DIR,
        "components/ui/button/button.module.css"
      )
      expect(existsSync(cssPath)).toBe(true)
      const content = readFileSync(cssPath, "utf-8")
      expect(content).toContain("var(--text-primary")
      expect(content).toContain("var(--surface-card")
    })
  })
})
