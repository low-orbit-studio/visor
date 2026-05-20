import { render, screen, fireEvent, act } from "@testing-library/react"
import { describe, it, expect, vi, afterEach } from "vitest"
import {
  PrototypeReview,
  isValidHex,
  type PrototypeReviewProps,
} from "../prototype-review"
import { checkA11y } from "../../../test-utils/a11y"

const treatments: PrototypeReviewProps["treatments"] = [
  {
    id: "t1",
    label: "T1",
    title: "Themed 2D Map",
    summary: "Dark cartography baseline.",
    description: "Map with pins.",
    metaLabel: "Owns cases 2 + 3",
    src: "/proto/t1.html",
    tags: ["temporal", "edge cases 2, 3"],
  },
  {
    id: "t3",
    label: "T3",
    title: "Animated Timeline",
    summary: "Horizontal months timeline.",
    description: "Months across X.",
    metaLabel: "Owns cases 4 + 5",
    src: "/proto/t3.html",
  },
]

const landing: PrototypeReviewProps["landing"] = {
  eyebrow: "Phase 2 design spike",
  title: "Three treatments. One brand color.",
  lede: "Pick a default.",
  contextCards: [
    { heading: "Brand color", body: "Per-EPK override." },
    { heading: "Decisions", body: "Locked in DECISIONS.md" },
  ],
}

const themes: PrototypeReviewProps["themes"] = [
  { id: "underground", label: "Underground", themeClass: "theme-underground" },
  { id: "minimal", label: "Minimal", themeClass: "theme-minimal" },
]

const defaultProps: PrototypeReviewProps = {
  ticketId: "BL-193",
  reviewLabel: "Design Review",
  subLabel: "Phase 2 prototypes",
  statusPills: [{ label: "type:spike" }, { label: "confidence:high" }],
  treatments,
  landing,
  themes,
  defaultThemeId: "underground",
  defaultMode: "dark",
  brand: { default: "#FFBE26" },
  footer: { left: "Phase 2 spike", right: "Static HTML" },
}

describe("PrototypeReview", () => {
  afterEach(() => {
    // Clean up theme class side effects between tests.
    document.documentElement.className = ""
    document.documentElement.removeAttribute("data-mode")
  })

  describe("rendering", () => {
    it("renders without crashing", () => {
      const { container } = render(<PrototypeReview {...defaultProps} />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it("renders the header with ticket id and review label", () => {
      render(<PrototypeReview {...defaultProps} />)
      expect(screen.getByText(/BL-193 · Design Review/)).toBeInTheDocument()
    })

    it("renders status pills", () => {
      render(<PrototypeReview {...defaultProps} />)
      expect(screen.getByText("type:spike")).toBeInTheDocument()
      expect(screen.getByText("confidence:high")).toBeInTheDocument()
    })

    it("renders the brand-current pill in the header", () => {
      const { container } = render(<PrototypeReview {...defaultProps} />)
      const pill = container.querySelector(
        "[data-slot='prototype-review-brand-pill']"
      )
      expect(pill).toBeInTheDocument()
      expect(pill).toHaveTextContent("#FFBE26")
    })

    it("renders the landing page by default (no treatment selected)", () => {
      render(<PrototypeReview {...defaultProps} />)
      expect(screen.getByText("Phase 2 design spike")).toBeInTheDocument()
      expect(
        screen.getByText("Three treatments. One brand color.")
      ).toBeInTheDocument()
    })

    it("renders all treatment cards on the landing page", () => {
      const { container } = render(<PrototypeReview {...defaultProps} />)
      const cards = container.querySelectorAll(
        "[data-slot='prototype-review-landing'] button"
      )
      expect(cards.length).toBe(2)
    })

    it("renders the stage when defaultTreatmentId is set", () => {
      const { container } = render(
        <PrototypeReview {...defaultProps} defaultTreatmentId="t1" />
      )
      expect(
        container.querySelector("[data-slot='prototype-review-stage']")
      ).toBeInTheDocument()
      expect(
        container.querySelector("[data-slot='prototype-review-landing']")
      ).not.toBeInTheDocument()
    })

    it("renders the footer when configured", () => {
      const { container } = render(<PrototypeReview {...defaultProps} />)
      const footer = container.querySelector(
        "[data-slot='prototype-review-footer']"
      )
      expect(footer).toBeInTheDocument()
      expect(footer).toHaveTextContent(/Phase 2 spike/)
      expect(footer).toHaveTextContent(/Static HTML/)
    })

    it("omits the footer when not configured", () => {
      const { container } = render(
        <PrototypeReview {...defaultProps} footer={undefined} />
      )
      expect(
        container.querySelector("[data-slot='prototype-review-footer']")
      ).not.toBeInTheDocument()
    })
  })

  describe("treatment switching", () => {
    it("switches to the stage when a tab is clicked", () => {
      const { container } = render(<PrototypeReview {...defaultProps} />)
      const t1Tab = screen.getByRole("tab", { name: /T1.*Themed 2D Map/ })
      fireEvent.click(t1Tab)
      expect(
        container.querySelector("[data-slot='prototype-review-stage']")
      ).toBeInTheDocument()
    })

    it("returns to the landing when Overview tab is clicked", () => {
      const { container } = render(
        <PrototypeReview {...defaultProps} defaultTreatmentId="t1" />
      )
      const overviewTab = screen.getByRole("tab", { name: /Overview/ })
      fireEvent.click(overviewTab)
      expect(
        container.querySelector("[data-slot='prototype-review-landing']")
      ).toBeInTheDocument()
    })

    it("switches to the stage when a landing card is clicked", () => {
      const { container } = render(<PrototypeReview {...defaultProps} />)
      const cards = container.querySelectorAll(
        "[data-slot='prototype-review-landing'] button"
      )
      const t3Card = Array.from(cards).find((b) =>
        b.textContent?.includes("Animated Timeline")
      ) as HTMLElement
      fireEvent.click(t3Card)
      const stage = container.querySelector(
        "[data-slot='prototype-review-stage']"
      )
      expect(stage).toBeInTheDocument()
      expect(stage).toHaveTextContent(/Animated Timeline/)
    })

    it("marks the active tab with aria-selected=true", () => {
      render(<PrototypeReview {...defaultProps} defaultTreatmentId="t3" />)
      const t3Tab = screen.getByRole("tab", { name: /T3.*Animated Timeline/ })
      expect(t3Tab).toHaveAttribute("aria-selected", "true")
    })
  })

  describe("viewport switching", () => {
    it("renders all viewport iframes by default", () => {
      const { container } = render(
        <PrototypeReview {...defaultProps} defaultTreatmentId="t1" />
      )
      const iframes = container.querySelectorAll("iframe")
      expect(iframes.length).toBe(3)
    })

    it("renders only one viewport when a single viewport is selected", () => {
      const { container } = render(
        <PrototypeReview {...defaultProps} defaultTreatmentId="t1" />
      )
      const mobileBtn = screen.getByRole("button", { name: "375" })
      fireEvent.click(mobileBtn)
      const iframes = container.querySelectorAll("iframe")
      expect(iframes.length).toBe(1)
      expect(iframes[0]).toHaveAttribute("data-viewport", "mobile")
    })

    it("applies aria-pressed=true to the active viewport button", () => {
      render(<PrototypeReview {...defaultProps} defaultTreatmentId="t1" />)
      const tabletBtn = screen.getByRole("button", { name: "768" })
      fireEvent.click(tabletBtn)
      expect(tabletBtn).toHaveAttribute("aria-pressed", "true")
    })

    it("appends brand, theme, and mode query params to iframe src", () => {
      const { container } = render(
        <PrototypeReview {...defaultProps} defaultTreatmentId="t1" />
      )
      const iframe = container.querySelector(
        "iframe[data-viewport='mobile']"
      ) as HTMLIFrameElement
      expect(iframe.src).toContain("brand=%23FFBE26")
      expect(iframe.src).toContain("theme=theme-underground")
      expect(iframe.src).toContain("mode=dark")
    })
  })

  describe("brand picker", () => {
    it("renders all swatches", () => {
      const { container } = render(<PrototypeReview {...defaultProps} />)
      const swatches = container.querySelectorAll(
        "[data-slot='prototype-review-swatches'] button"
      )
      expect(swatches.length).toBe(6)
    })

    it("changes the active brand when a swatch is clicked", () => {
      const { container } = render(<PrototypeReview {...defaultProps} />)
      const orangeSwatch = container.querySelector(
        '[aria-label="Brand Hazard Orange"]'
      ) as HTMLElement
      fireEvent.click(orangeSwatch)
      const pill = container.querySelector(
        "[data-slot='prototype-review-brand-pill']"
      )
      expect(pill).toHaveTextContent("#FF5A1F")
    })

    it("changes brand via hex input", () => {
      const { container } = render(<PrototypeReview {...defaultProps} />)
      const input = screen.getByLabelText("Brand hex value") as HTMLInputElement
      fireEvent.change(input, { target: { value: "#abcdef" } })
      const pill = container.querySelector(
        "[data-slot='prototype-review-brand-pill']"
      )
      expect(pill).toHaveTextContent("#ABCDEF")
    })

    it("ignores invalid hex input", () => {
      const { container } = render(<PrototypeReview {...defaultProps} />)
      const input = screen.getByLabelText("Brand hex value") as HTMLInputElement
      fireEvent.change(input, { target: { value: "not-a-color" } })
      const pill = container.querySelector(
        "[data-slot='prototype-review-brand-pill']"
      )
      // Should remain the default brand.
      expect(pill).toHaveTextContent("#FFBE26")
    })

    it("resets to default when reset button is clicked", () => {
      const { container } = render(<PrototypeReview {...defaultProps} />)
      const orangeSwatch = container.querySelector(
        '[aria-label="Brand Hazard Orange"]'
      ) as HTMLElement
      fireEvent.click(orangeSwatch)
      const resetBtn = screen.getByRole("button", { name: "Reset" })
      fireEvent.click(resetBtn)
      const pill = container.querySelector(
        "[data-slot='prototype-review-brand-pill']"
      )
      expect(pill).toHaveTextContent("#FFBE26")
    })

    it("hides the brand picker when disabled", () => {
      render(
        <PrototypeReview
          {...defaultProps}
          brand={{ default: "#FFBE26", disabled: true }}
        />
      )
      expect(screen.queryByLabelText("Brand color")).not.toBeInTheDocument()
    })
  })

  describe("theme + mode propagation", () => {
    it("renders both theme switcher and mode toggle", () => {
      render(<PrototypeReview {...defaultProps} />)
      expect(screen.getByLabelText("Theme")).toBeInTheDocument()
      expect(screen.getByRole("group", { name: "Mode" })).toBeInTheDocument()
    })

    it("applies the active theme class to documentElement", () => {
      render(<PrototypeReview {...defaultProps} />)
      expect(
        document.documentElement.classList.contains("theme-underground")
      ).toBe(true)
    })

    it("switches the documentElement class when theme changes", () => {
      render(<PrototypeReview {...defaultProps} />)
      const select = screen.getByLabelText("Theme") as HTMLSelectElement
      fireEvent.change(select, { target: { value: "minimal" } })
      expect(
        document.documentElement.classList.contains("theme-minimal")
      ).toBe(true)
      expect(
        document.documentElement.classList.contains("theme-underground")
      ).toBe(false)
    })

    it("sets data-mode on documentElement", () => {
      render(<PrototypeReview {...defaultProps} />)
      expect(document.documentElement.getAttribute("data-mode")).toBe("dark")
    })

    it("updates data-mode when mode is toggled", () => {
      render(<PrototypeReview {...defaultProps} />)
      const lightBtn = screen.getByRole("button", { name: "Light" })
      fireEvent.click(lightBtn)
      expect(document.documentElement.getAttribute("data-mode")).toBe("light")
    })

    it("broadcasts theme/mode/brand to iframes via postMessage", async () => {
      const { container } = render(
        <PrototypeReview {...defaultProps} defaultTreatmentId="t1" />
      )
      const iframe = container.querySelector("iframe") as HTMLIFrameElement
      const postSpy = vi.fn()
      Object.defineProperty(iframe, "contentWindow", {
        configurable: true,
        get: () => ({ postMessage: postSpy }),
      })

      // Trigger a state change.
      const lightBtn = screen.getByRole("button", { name: "Light" })
      await act(async () => {
        fireEvent.click(lightBtn)
      })

      expect(postSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "prototype-theme",
          themeClass: "theme-underground",
          mode: "light",
          brand: "#FFBE26",
        }),
        "*"
      )
    })

    it("calls onStateChange when state changes", () => {
      const onStateChange = vi.fn()
      render(
        <PrototypeReview {...defaultProps} onStateChange={onStateChange} />
      )
      const lightBtn = screen.getByRole("button", { name: "Light" })
      fireEvent.click(lightBtn)
      expect(onStateChange).toHaveBeenCalled()
      const lastCall = onStateChange.mock.calls[onStateChange.mock.calls.length - 1]
      expect(lastCall[0]).toMatchObject({ mode: "light" })
    })
  })

  describe("data attributes", () => {
    it("sets data-slot=prototype-review on the root", () => {
      const { container } = render(<PrototypeReview {...defaultProps} />)
      expect(container.firstChild).toHaveAttribute(
        "data-slot",
        "prototype-review"
      )
    })

    it("sets data-mode on the root", () => {
      const { container } = render(
        <PrototypeReview {...defaultProps} defaultMode="light" />
      )
      expect(container.firstChild).toHaveAttribute("data-mode", "light")
    })

    it("sets data-theme on the root", () => {
      const { container } = render(<PrototypeReview {...defaultProps} />)
      expect(container.firstChild).toHaveAttribute("data-theme", "underground")
    })
  })

  describe("className passthrough", () => {
    it("applies custom className to the root", () => {
      const { container } = render(
        <PrototypeReview {...defaultProps} className="custom-review" />
      )
      expect(container.firstChild).toHaveClass("custom-review")
    })
  })

  describe("isValidHex", () => {
    it("accepts valid 6-char hex", () => {
      expect(isValidHex("#FFBE26")).toBe(true)
      expect(isValidHex("#ffbe26")).toBe(true)
    })
    it("rejects non-hex inputs", () => {
      expect(isValidHex("FFBE26")).toBe(false)
      expect(isValidHex("#FFB")).toBe(false)
      expect(isValidHex("not-a-color")).toBe(false)
      expect(isValidHex("")).toBe(false)
    })
  })

  describe("a11y", () => {
    it("passes accessibility checks (landing)", async () => {
      const { container } = render(<PrototypeReview {...defaultProps} />)
      await checkA11y(container)
    })

    it("passes accessibility checks (stage)", async () => {
      const { container } = render(
        <PrototypeReview {...defaultProps} defaultTreatmentId="t1" />
      )
      // Strip iframes before axe — axe-core cannot communicate with
      // child frames in jsdom (no real cross-frame messaging).
      container
        .querySelectorAll("iframe")
        .forEach((frame) => frame.remove())
      await checkA11y(container)
    })
  })
})
