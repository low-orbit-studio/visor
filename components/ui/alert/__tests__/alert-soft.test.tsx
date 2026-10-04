import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import * as React from "react"
import { render, screen } from "@testing-library/react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, it, expect } from "vitest"
import {
  CheckCircle,
  Info,
  Lightning,
  Warning,
  WarningOctagon,
} from "@phosphor-icons/react/dist/ssr"
import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertLead,
  AlertTitle,
  alertVariants,
} from "../alert"
import styles from "../alert.module.css"
import { checkA11y } from "../../../../test-utils/a11y"

type Variant = "default" | "destructive" | "success" | "warning" | "info"

const EDGED: Record<Variant, string> = {
  default: styles.variantDefault,
  destructive: styles.variantDestructive,
  success: styles.variantSuccess,
  warning: styles.variantWarning,
  info: styles.variantInfo,
}

const SOFT: Record<
  Variant,
  { fill: string; Icon: React.ElementType; size: number; role: "alert" | "status" }
> = {
  destructive: { fill: styles.softDestructive, Icon: WarningOctagon, size: 32, role: "alert" },
  warning: { fill: styles.softWarning, Icon: Warning, size: 32, role: "status" },
  success: { fill: styles.softSuccess, Icon: CheckCircle, size: 32, role: "status" },
  default: { fill: styles.softNote, Icon: Info, size: 24, role: "status" },
  // `info` has no soft surface yet, so it falls back to the neutral note.
  info: { fill: styles.softNote, Icon: Info, size: 24, role: "status" },
}

const VARIANTS = Object.keys(SOFT) as Variant[]

function softAlert(variant: Variant, props: Partial<React.ComponentProps<typeof Alert>> = {}) {
  return render(
    <Alert appearance="soft" variant={variant} data-testid="alert" {...props}>
      <AlertDescription>
        <AlertLead>Can&apos;t sign in.</AlertLead> That email isn&apos;t on the guest list.
      </AlertDescription>
    </Alert>
  )
}

function iconOf(root: HTMLElement) {
  const svg = root.querySelector('[data-slot="alert-icon"] > svg')
  expect(svg).not.toBeNull()
  return svg as SVGSVGElement
}

describe("Alert appearance=\"soft\" (VI-698)", () => {
  describe.each(VARIANTS)("%s", (variant) => {
    const spec = SOFT[variant]

    it("carries the soft fill class and not the edged variant class", () => {
      softAlert(variant)
      const root = screen.getByTestId("alert")
      expect(root).toHaveClass(styles.base, styles.soft, spec.fill)
      expect(root).not.toHaveClass(EDGED[variant])
      expect(root).toHaveAttribute("data-appearance", "soft")
    })

    it(`draws its default icon at ${spec.size}px, hidden from assistive tech`, () => {
      softAlert(variant)
      const svg = iconOf(screen.getByTestId("alert"))
      expect(svg).toHaveAttribute("width", String(spec.size))
      expect(svg).toHaveAttribute("height", String(spec.size))
      expect(svg).toHaveAttribute("aria-hidden", "true")
      const expected = renderToStaticMarkup(
        <spec.Icon size={spec.size} aria-hidden={true} />
      )
      expect(svg.outerHTML).toBe(expected)
    })

    it(`defaults role to ${spec.role}`, () => {
      softAlert(variant)
      expect(screen.getByTestId("alert")).toHaveAttribute("role", spec.role)
    })

    it("has no WCAG 2.1 AA violations", async () => {
      const { container } = render(
        <Alert appearance="soft" variant={variant}>
          <AlertDescription>
            <AlertLead>Heads up.</AlertLead> Something needs your attention.
          </AlertDescription>
          <AlertActions>
            <button type="button">Try again</button>
          </AlertActions>
        </Alert>
      )
      await checkA11y(container)
    })
  })

  describe("role", () => {
    it("lets an explicit role override the variant mapping", () => {
      softAlert("destructive", { role: "status" })
      expect(screen.getByTestId("alert")).toHaveAttribute("role", "status")
    })

    it("lets an explicit role override on a non-destructive tone", () => {
      softAlert("warning", { role: "alert" })
      expect(screen.getByTestId("alert")).toHaveAttribute("role", "alert")
    })
  })

  describe("icon prop", () => {
    it("replaces the tone's default icon, at the tone's size", () => {
      softAlert("destructive", { icon: <Lightning data-testid="custom-icon" /> })
      const svg = iconOf(screen.getByTestId("alert"))
      expect(svg).toHaveAttribute("data-testid", "custom-icon")
      expect(svg).toHaveAttribute("width", "32")
      expect(svg).toHaveAttribute("aria-hidden", "true")
    })

    it("sizes a custom note icon at the note size", () => {
      softAlert("default", { icon: <Lightning /> })
      expect(iconOf(screen.getByTestId("alert"))).toHaveAttribute("width", "24")
    })
  })

  describe("content", () => {
    it("sets the lead inline before the body, inside the description", () => {
      softAlert("destructive")
      const lead = screen.getByText("Can't sign in.")
      expect(lead.tagName).toBe("STRONG")
      expect(lead).toHaveAttribute("data-slot", "alert-lead")
      expect(lead).toHaveClass(styles.lead)
      const description = lead.parentElement as HTMLElement
      expect(description).toHaveAttribute("data-slot", "alert-description")
      expect(description.firstChild).toBe(lead)
      expect(description.textContent).toBe("Can't sign in. That email isn't on the guest list.")
    })

    it("places the icon beside a content column that holds the text", () => {
      softAlert("warning")
      const root = screen.getByTestId("alert")
      const [icon, content] = Array.from(root.children)
      expect(icon).toHaveAttribute("data-slot", "alert-icon")
      expect(content).toHaveAttribute("data-slot", "alert-content")
      expect(content).toHaveClass(styles.content)
      expect(content.querySelector('[data-slot="alert-description"]')).not.toBeNull()
    })

    it("renders the action row under the text", () => {
      render(
        <Alert appearance="soft" variant="destructive" data-testid="alert">
          <AlertDescription>
            <AlertLead>This can&apos;t be undone.</AlertLead> The two profiles merge into one.
          </AlertDescription>
          <AlertActions>
            <button type="button">Cancel</button>
            <button type="button">Merge</button>
          </AlertActions>
        </Alert>
      )
      const content = screen
        .getByTestId("alert")
        .querySelector('[data-slot="alert-content"]') as HTMLElement
      const [text, actions] = Array.from(content.children)
      expect(text).toHaveAttribute("data-slot", "alert-description")
      expect(actions).toHaveAttribute("data-slot", "alert-actions")
      expect(actions).toContainElement(screen.getByRole("button", { name: "Merge" }))
    })

    it("still renders a block AlertTitle", () => {
      render(
        <Alert appearance="soft" variant="success">
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>Your changes are live.</AlertDescription>
        </Alert>
      )
      expect(screen.getByText("Saved")).toHaveAttribute("data-slot", "alert-title")
    })
  })

  describe("styles", () => {
    const css = readFileSync(
      resolve(process.cwd(), "components/ui/alert/alert.module.css"),
      "utf8"
    )

    function rule(selector: string) {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const match = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`))
      expect(match, `missing rule ${selector}`).not.toBeNull()
      return (match as RegExpMatchArray)[1]
    }

    it("draws no edge and no shadow", () => {
      expect(rule(".soft")).toContain("box-shadow: none")
      for (const selector of [".soft", ".softDestructive", ".softWarning", ".softSuccess", ".softNote"]) {
        expect(rule(selector)).not.toMatch(/\bborder\s*:/)
      }
    })

    it("fills each tone with its soft surface", () => {
      expect(rule(".softDestructive")).toContain("var(--surface-error-soft")
      expect(rule(".softWarning")).toContain("var(--surface-warning-soft")
      expect(rule(".softSuccess")).toContain("var(--surface-success-soft")
    })

    it("sizes the icon from the component tokens", () => {
      expect(rule(".icon > svg")).toContain("width: var(--alert-icon-size, 2rem)")
      expect(rule(".softNote .icon > svg")).toContain("width: var(--alert-icon-size-note, 1.5rem)")
    })

    it("keeps the body in secondary ink, not the tone's colour", () => {
      expect(rule(".soft .description")).toContain("color: var(--text-secondary")
    })

    // MDX wraps multi-line children in a <p>, and prose styles give it a top
    // and bottom margin that pushed the text below the icon (operator review).
    it("trims the outer margins of whatever sits at the text's edges", () => {
      expect(rule(".content > :first-child,\n.soft .description > :first-child")).toContain(
        "margin-top: 0"
      )
      expect(rule(".content > :last-child,\n.soft .description > :last-child")).toContain(
        "margin-bottom: 0"
      )
    })

    it("gives the lead no margin of its own", () => {
      expect(rule(".lead")).not.toMatch(/\bmargin/)
    })

    it("leaves the action row's buttons their own face", () => {
      expect(rule(".actions")).not.toMatch(/\b(color|background|border|padding|font|all)\b[\w-]*\s*:/)
    })
  })
})

describe("Alert soft docs example (VI-698)", () => {
  const mdx = readFileSync(
    resolve(process.cwd(), "packages/docs/content/docs/components/feedback/alert.mdx"),
    "utf8"
  )
  const section = mdx.slice(mdx.indexOf('title="Soft Alert With Actions"'))
  const preview = section.slice(0, section.indexOf("</ComponentPreview>"))
  const actions = preview.slice(preview.lastIndexOf("<AlertActions>"), preview.lastIndexOf("</AlertActions>"))

  it("renders its action row with the Visor Button, not a bare button", () => {
    expect(actions).toMatch(/<Button variant="destructive" size="sm">Merge profiles<\/Button>/)
    expect(actions).toMatch(/<Button variant="ghost" size="sm">Cancel<\/Button>/)
    expect(actions).not.toMatch(/<button\b/)
  })
})

describe("Alert without appearance — regression guard (VI-698)", () => {
  it.each(VARIANTS)("%s keeps today's class list, role and children", (variant) => {
    render(
      <Alert variant={variant} data-testid="alert">
        <AlertDescription>Body</AlertDescription>
      </Alert>
    )
    const root = screen.getByTestId("alert")
    expect(root.className.split(" ")).toEqual([styles.base, EDGED[variant]])
    expect(root).toHaveAttribute("role", "alert")
    expect(root).not.toHaveAttribute("data-appearance")
    expect(root.querySelector('[data-slot="alert-icon"]')).toBeNull()
    expect(root.firstElementChild).toHaveAttribute("data-slot", "alert-description")
  })

  it("defaults to the default variant", () => {
    render(<Alert data-testid="alert">Body</Alert>)
    expect(screen.getByTestId("alert").className.split(" ")).toEqual([
      styles.base,
      styles.variantDefault,
    ])
  })

  it("keeps alertVariants' output for every variant", () => {
    for (const variant of VARIANTS) {
      expect(alertVariants({ variant })).toBe(`${styles.base} ${EDGED[variant]}`)
    }
  })

  it("ignores icon outside the soft appearance", () => {
    render(
      <Alert variant="warning" icon={<Lightning />} data-testid="alert">
        Body
      </Alert>
    )
    const root = screen.getByTestId("alert")
    expect(root.querySelector("svg")).toBeNull()
    expect(root).not.toHaveAttribute("icon")
  })
})
