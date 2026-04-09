import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { DesignSystemDeck } from "../design-system-deck"
import { designSystemDeckRegistry } from "../registry"
import { TitleSlide } from "../slides/title-slide"
import { ThemeColorsSlide } from "../slides/theme-colors-slide"
import { StatusColorsSlide } from "../slides/status-colors-slide"
import { SemanticTokensSlide } from "../slides/semantic-tokens-slide"
import { TypeDisplaySlide } from "../slides/type-display-slide"
import { TypeBodySlide } from "../slides/type-body-slide"
import { ThemeArchitectureSlide } from "../slides/theme-architecture-slide"
import { SpacingSlide } from "../slides/spacing-slide"
import { ElevationSlide } from "../slides/elevation-slide"
import { RadiusSlide } from "../slides/radius-slide"
import { MotionSlide } from "../slides/motion-slide"
import { OpacitySlide } from "../slides/opacity-slide"
import { IconsSlide } from "../slides/icons-slide"
import { AccessibilitySlide } from "../slides/accessibility-slide"
import { ButtonSpecimenSlide } from "../slides/button-specimen-slide"
import { FormSpecimenSlide } from "../slides/form-specimen-slide"
import { ComponentShowcaseSlide } from "../slides/component-showcase-slide"
import { ClosingSlide } from "../slides/closing-slide"

describe("Design System Deck Slides", () => {
  // ─── Registry ───────────────────────────────────────────────────────────────

  describe("registry", () => {
    it("has 17 slides", () => {
      expect(designSystemDeckRegistry.slides).toHaveLength(17)
    })

    it("has all expected sections", () => {
      const sections = [...new Set(designSystemDeckRegistry.slides.map((s) => s.section))]
      expect(sections).toEqual(["_title", "Foundation", "Visual Language", "Utility", "Components", "_closing"])
    })

    it("each slide has unique id", () => {
      const ids = designSystemDeckRegistry.slides.map((s) => s.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it("each slide has a component", () => {
      for (const slide of designSystemDeckRegistry.slides) {
        expect(typeof slide.component).toBe("function")
      }
    })
  })

  // ─── Individual Slides ──────────────────────────────────────────────────────

  describe("TitleSlide", () => {
    it("renders deck identity", () => {
      render(<TitleSlide />)
      expect(screen.getByText("Visor")).toBeInTheDocument()
      expect(screen.getByText("Design System")).toBeInTheDocument()
    })
  })

  describe("ThemeColorsSlide", () => {
    it("renders theme color scale labels", () => {
      render(<ThemeColorsSlide />)
      expect(screen.getByText("Primary")).toBeInTheDocument()
      expect(screen.getByText("Neutral")).toBeInTheDocument()
    })
  })

  describe("StatusColorsSlide", () => {
    it("renders status color scale labels", () => {
      render(<StatusColorsSlide />)
      expect(screen.getByText("Success")).toBeInTheDocument()
      expect(screen.getByText("Warning")).toBeInTheDocument()
      expect(screen.getByText("Error")).toBeInTheDocument()
      expect(screen.getByText("Info")).toBeInTheDocument()
    })
  })

  describe("SemanticTokensSlide", () => {
    it("renders semantic categories", () => {
      render(<SemanticTokensSlide />)
      expect(screen.getAllByText("Text").length).toBeGreaterThan(0)
      expect(screen.getAllByText("Surface").length).toBeGreaterThan(0)
      expect(screen.getAllByText("Border").length).toBeGreaterThan(0)
    })
  })

  describe("TypeDisplaySlide", () => {
    it("renders display type specimens", () => {
      render(<TypeDisplaySlide />)
      expect(screen.getByText("Display text")).toBeInTheDocument()
      expect(screen.getByText("Section heading")).toBeInTheDocument()
    })
  })

  describe("TypeBodySlide", () => {
    it("renders body type specimens", () => {
      render(<TypeBodySlide />)
      expect(screen.getByText(/Default body text/)).toBeInTheDocument()
      expect(screen.getByText(/Fine print/)).toBeInTheDocument()
    })
  })

  describe("ThemeArchitectureSlide", () => {
    it("renders theme layers", () => {
      render(<ThemeArchitectureSlide />)
      expect(screen.getByText("Primitives")).toBeInTheDocument()
      expect(screen.getByText("Semantic")).toBeInTheDocument()
      expect(screen.getByText("Adaptive")).toBeInTheDocument()
    })
  })

  describe("SpacingSlide", () => {
    it("renders spacing scale", () => {
      render(<SpacingSlide />)
      expect(screen.getByText("Spacing")).toBeInTheDocument()
    })
  })

  describe("ElevationSlide", () => {
    it("renders shadow and surface labels", () => {
      render(<ElevationSlide />)
      expect(screen.getByText("Shadows")).toBeInTheDocument()
      expect(screen.getByText("Surfaces")).toBeInTheDocument()
    })
  })

  describe("RadiusSlide", () => {
    it("renders radius scale", () => {
      render(<RadiusSlide />)
      expect(screen.getByText("Border Radius")).toBeInTheDocument()
    })
  })

  describe("MotionSlide", () => {
    it("renders duration and easing sections", () => {
      render(<MotionSlide />)
      expect(screen.getByText("Durations")).toBeInTheDocument()
      expect(screen.getByText("Easing Curves")).toBeInTheDocument()
    })
  })

  describe("OpacitySlide", () => {
    it("renders opacity levels", () => {
      render(<OpacitySlide />)
      expect(screen.getByText("text-primary")).toBeInTheDocument()
      expect(screen.getByText("text-secondary")).toBeInTheDocument()
      expect(screen.getByText("text-tertiary")).toBeInTheDocument()
      expect(screen.getByText("text-disabled")).toBeInTheDocument()
    })
  })

  describe("IconsSlide", () => {
    it("renders icon grid sections", () => {
      render(<IconsSlide />)
      expect(screen.getByText("Size Scale")).toBeInTheDocument()
      expect(screen.getByText("Icon Map")).toBeInTheDocument()
      expect(screen.getByText("Home / dashboard")).toBeInTheDocument()
    })
  })

  describe("AccessibilitySlide", () => {
    it("renders contrast pairs", () => {
      render(<AccessibilitySlide />)
      const aaBadges = screen.getAllByText(/^AA/)
      expect(aaBadges.length).toBeGreaterThan(0)
    })
  })

  describe("ButtonSpecimenSlide", () => {
    it("renders all button variants", () => {
      render(<ButtonSpecimenSlide />)
      expect(screen.getByRole("button", { name: "default" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "secondary" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "outline" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "ghost" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "destructive" })).toBeInTheDocument()
    })
  })

  describe("FormSpecimenSlide", () => {
    it("renders curated form controls", () => {
      render(<FormSpecimenSlide />)
      expect(screen.getByText("Text Input")).toBeInTheDocument()
      expect(screen.getByText("Switch")).toBeInTheDocument()
      expect(screen.getByText("Checkbox")).toBeInTheDocument()
    })
  })

  describe("ComponentShowcaseSlide", () => {
    it("renders showcase items", () => {
      render(<ComponentShowcaseSlide />)
      expect(screen.getByText("Card Title")).toBeInTheDocument()
      expect(screen.getByText("Overview content goes here.")).toBeInTheDocument()
    })
  })

  describe("ClosingSlide", () => {
    it("renders closing content", () => {
      render(<ClosingSlide />)
      expect(screen.getByText("Start Building")).toBeInTheDocument()
    })
  })

  // ─── All slides render ──────────────────────────────────────────────────────

  describe("all slides render via registry", () => {
    for (const entry of designSystemDeckRegistry.slides) {
      it(`renders ${entry.title} slide`, () => {
        const Component = entry.component
        const { container } = render(<Component />)
        expect(container.innerHTML.length).toBeGreaterThan(0)
      })
    }
  })
})

// ─── DesignSystemDeck Wrapper ─────────────────────────────────────────────────

describe("DesignSystemDeck", () => {
  it("renders the deck-renderer slot", () => {
    const { container } = render(<DesignSystemDeck />)
    expect(container.querySelector("[data-slot='deck-renderer']")).toBeInTheDocument()
  })

  it("renders all 17 slide components", () => {
    const { container } = render(<DesignSystemDeck />)
    const slides = container.querySelectorAll("[data-slot='slide']")
    // 17 content slides + TOC slide (showTOC defaults to true)
    expect(slides.length).toBeGreaterThanOrEqual(17)
  })

  it("includes TOC slide by default", () => {
    render(<DesignSystemDeck />)
    expect(screen.getAllByText("Table of Contents").length).toBeGreaterThan(0)
  })

  it("hides TOC slide when showTOC is false", () => {
    render(<DesignSystemDeck showTOC={false} />)
    expect(screen.queryAllByText("Table of Contents")).toHaveLength(0)
  })

  it("passes className to root element", () => {
    const { container } = render(<DesignSystemDeck className="test-class" />)
    const root = container.querySelector("[data-slot='deck-renderer']")
    expect(root?.classList.contains("test-class")).toBe(true)
  })
})
