import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  BentoGrid,
  BentoTile,
  BentoTileMedia,
  BentoTileBody,
} from "../bento-grid"

// ---------------------------------------------------------------------------
// BentoGrid
// ---------------------------------------------------------------------------

describe("BentoGrid", () => {
  it("renders children", () => {
    render(
      <BentoGrid>
        <div>Tile</div>
      </BentoGrid>
    )
    expect(screen.getByText("Tile")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(<BentoGrid>grid</BentoGrid>)
    expect(container.querySelector("[data-slot='bento-grid']")).toBeTruthy()
  })

  it("sets --bento-cols CSS variable for numeric cols", () => {
    const { container } = render(<BentoGrid cols={3}>grid</BentoGrid>)
    const el = container.firstChild as HTMLElement
    expect(el.style.getPropertyValue("--bento-cols")).toBe("3")
  })

  it("sets --bento-cols CSS variable from responsive base", () => {
    const { container } = render(
      <BentoGrid cols={{ base: 1, md: 2 }}>grid</BentoGrid>
    )
    const el = container.firstChild as HTMLElement
    expect(el.style.getPropertyValue("--bento-cols")).toBe("1")
    expect(el.style.getPropertyValue("--bento-cols-md")).toBe("2")
  })

  it("sets responsive sm/lg/xl cols when provided", () => {
    const { container } = render(
      <BentoGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}>grid</BentoGrid>
    )
    const el = container.firstChild as HTMLElement
    expect(el.style.getPropertyValue("--bento-cols-sm")).toBe("2")
    expect(el.style.getPropertyValue("--bento-cols-lg")).toBe("3")
    expect(el.style.getPropertyValue("--bento-cols-xl")).toBe("4")
  })

  it("sets --bento-gap CSS variable", () => {
    const { container } = render(<BentoGrid gap="6">grid</BentoGrid>)
    const el = container.firstChild as HTMLElement
    expect(el.style.getPropertyValue("--bento-gap")).toContain("--spacing-6")
  })

  it("accepts custom className", () => {
    const { container } = render(
      <BentoGrid className="custom-grid">grid</BentoGrid>
    )
    const el = container.firstChild as HTMLElement
    expect(el.classList.contains("custom-grid")).toBe(true)
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<BentoGrid ref={ref}>grid</BentoGrid>)
    expect(ref.current).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// BentoTile — span variants
// ---------------------------------------------------------------------------

describe("BentoTile span variants", () => {
  it('renders as <article> by default (no href)', () => {
    render(<BentoTile>tile content</BentoTile>)
    const tile = screen.getByText("tile content").closest("article")
    expect(tile).toBeTruthy()
  })

  it('applies data-span="half" by default', () => {
    render(<BentoTile>tile</BentoTile>)
    const tile = screen.getByText("tile").closest("[data-slot='bento-tile']")
    expect(tile).toHaveAttribute("data-span", "half")
  })

  it('applies data-span="full" when span="full"', () => {
    render(<BentoTile span="full">tile</BentoTile>)
    const tile = screen.getByText("tile").closest("[data-slot='bento-tile']")
    expect(tile).toHaveAttribute("data-span", "full")
  })

  it("applies numeric span as CSS variable", () => {
    const { container } = render(<BentoTile span={3}>tile</BentoTile>)
    const tile = container.querySelector("[data-slot='bento-tile']") as HTMLElement
    expect(tile.style.getPropertyValue("--bento-tile-span")).toBe("3")
  })

  it("applies data-slot attribute", () => {
    render(<BentoTile>tile</BentoTile>)
    expect(
      screen.getByText("tile").closest("[data-slot='bento-tile']")
    ).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// BentoTile — aspect variants
// ---------------------------------------------------------------------------

describe("BentoTile aspect variants", () => {
  it("applies --bento-tile-aspect for 21/9", () => {
    const { container } = render(<BentoTile aspect="21/9">tile</BentoTile>)
    const tile = container.querySelector("[data-slot='bento-tile']") as HTMLElement
    expect(tile.style.getPropertyValue("--bento-tile-aspect")).toBe("21 / 9")
  })

  it("applies --bento-tile-aspect for 2/1", () => {
    const { container } = render(<BentoTile aspect="2/1">tile</BentoTile>)
    const tile = container.querySelector("[data-slot='bento-tile']") as HTMLElement
    expect(tile.style.getPropertyValue("--bento-tile-aspect")).toBe("2 / 1")
  })

  it("applies --bento-tile-aspect for 4/3", () => {
    const { container } = render(<BentoTile aspect="4/3">tile</BentoTile>)
    const tile = container.querySelector("[data-slot='bento-tile']") as HTMLElement
    expect(tile.style.getPropertyValue("--bento-tile-aspect")).toBe("4 / 3")
  })

  it("applies --bento-tile-aspect for 1/1", () => {
    const { container } = render(<BentoTile aspect="1/1">tile</BentoTile>)
    const tile = container.querySelector("[data-slot='bento-tile']") as HTMLElement
    expect(tile.style.getPropertyValue("--bento-tile-aspect")).toBe("1 / 1")
  })

  it("omits --bento-tile-aspect when aspect is not set", () => {
    const { container } = render(<BentoTile>tile</BentoTile>)
    const tile = container.querySelector("[data-slot='bento-tile']") as HTMLElement
    expect(tile.style.getPropertyValue("--bento-tile-aspect")).toBe("")
  })
})

// ---------------------------------------------------------------------------
// BentoTile — fit variants
// ---------------------------------------------------------------------------

describe("BentoTile fit variants", () => {
  it('applies data-fit="cover" by default', () => {
    render(<BentoTile>tile</BentoTile>)
    const tile = screen.getByText("tile").closest("[data-slot='bento-tile']")
    expect(tile).toHaveAttribute("data-fit", "cover")
  })

  it('applies data-fit="contain" when fit="contain"', () => {
    render(<BentoTile fit="contain">tile</BentoTile>)
    const tile = screen.getByText("tile").closest("[data-slot='bento-tile']")
    expect(tile).toHaveAttribute("data-fit", "contain")
  })
})

// ---------------------------------------------------------------------------
// BentoTile — polymorphic root (article vs anchor)
// ---------------------------------------------------------------------------

describe("BentoTile polymorphic root", () => {
  it("renders <article> when no href provided", () => {
    const { container } = render(<BentoTile>tile</BentoTile>)
    expect(container.querySelector("article")).toBeTruthy()
    expect(container.querySelector("a")).toBeNull()
  })

  it("renders <a> when href is provided", () => {
    const { container } = render(
      <BentoTile href="https://example.com">tile</BentoTile>
    )
    expect(container.querySelector("a")).toBeTruthy()
    expect(container.querySelector("article")).toBeNull()
    const anchor = container.querySelector("a") as HTMLAnchorElement
    expect(anchor.href).toBe("https://example.com/")
  })

  it("passes target and rel to anchor", () => {
    const { container } = render(
      <BentoTile href="https://example.com" target="_blank" rel="noopener">
        tile
      </BentoTile>
    )
    const anchor = container.querySelector("a") as HTMLAnchorElement
    expect(anchor.target).toBe("_blank")
    expect(anchor.rel).toBe("noopener")
  })

  it("auto-applies noopener noreferrer when target=_blank and no rel", () => {
    const { container } = render(
      <BentoTile href="https://example.com" target="_blank">
        tile
      </BentoTile>
    )
    const anchor = container.querySelector("a") as HTMLAnchorElement
    expect(anchor.rel).toBe("noopener noreferrer")
  })
})

// ---------------------------------------------------------------------------
// BentoTileMedia
// ---------------------------------------------------------------------------

describe("BentoTileMedia", () => {
  it("renders an img element", () => {
    const { container } = render(
      <BentoTileMedia src="/test.jpg" alt="Test image" />
    )
    const img = container.querySelector("img")
    expect(img).toBeTruthy()
    expect(img?.getAttribute("src")).toBe("/test.jpg")
    expect(img?.getAttribute("alt")).toBe("Test image")
  })

  it("defaults to lazy loading", () => {
    const { container } = render(
      <BentoTileMedia src="/test.jpg" alt="Test" />
    )
    const img = container.querySelector("img") as HTMLImageElement
    // jsdom reflects loading as an attribute; use getAttribute for compatibility
    expect(img.getAttribute("loading")).toBe("lazy")
  })

  it("accepts eager loading", () => {
    const { container } = render(
      <BentoTileMedia src="/test.jpg" alt="Test" loading="eager" />
    )
    const img = container.querySelector("img") as HTMLImageElement
    expect(img.getAttribute("loading")).toBe("eager")
  })

  it("applies data-slot attribute", () => {
    const { container } = render(
      <BentoTileMedia src="/test.jpg" alt="Test" />
    )
    expect(
      container.querySelector("[data-slot='bento-tile-media']")
    ).toBeTruthy()
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<BentoTileMedia ref={ref} src="/test.jpg" alt="Test" />)
    expect(ref.current).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// BentoTileBody
// ---------------------------------------------------------------------------

describe("BentoTileBody", () => {
  it("renders children", () => {
    render(<BentoTileBody>Body content</BentoTileBody>)
    expect(screen.getByText("Body content")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(
      <BentoTileBody>body</BentoTileBody>
    )
    expect(
      container.querySelector("[data-slot='bento-tile-body']")
    ).toBeTruthy()
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<BentoTileBody ref={ref}>body</BentoTileBody>)
    expect(ref.current).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Compound usage
// ---------------------------------------------------------------------------

describe("BentoGrid compound usage", () => {
  it("renders a full 2-col grid with full+half tiles", () => {
    render(
      <BentoGrid cols={2} data-testid="grid">
        <BentoTile span="full" aspect="21/9">
          <BentoTileMedia src="/hero.jpg" alt="Hero" />
          <BentoTileBody>
            <span>Hero tile</span>
          </BentoTileBody>
        </BentoTile>
        <BentoTile span="half" aspect="2/1">
          <BentoTileBody>
            <span>Left</span>
          </BentoTileBody>
        </BentoTile>
        <BentoTile span="half" aspect="2/1">
          <BentoTileBody>
            <span>Right</span>
          </BentoTileBody>
        </BentoTile>
      </BentoGrid>
    )
    expect(screen.getByText("Hero tile")).toBeInTheDocument()
    expect(screen.getByText("Left")).toBeInTheDocument()
    expect(screen.getByText("Right")).toBeInTheDocument()
  })

  it("renders contain vs cover tiles side by side", () => {
    render(
      <BentoGrid cols={2}>
        <BentoTile span="half" fit="cover">
          <BentoTileMedia src="/cover.jpg" alt="Cover image" />
          <BentoTileBody>
            <span>Cover</span>
          </BentoTileBody>
        </BentoTile>
        <BentoTile span="half" fit="contain">
          <BentoTileMedia src="/logo.png" alt="Logo" />
          <BentoTileBody>
            <span>Contain</span>
          </BentoTileBody>
        </BentoTile>
      </BentoGrid>
    )
    expect(screen.getByText("Cover")).toBeInTheDocument()
    expect(screen.getByText("Contain")).toBeInTheDocument()
  })

  it("renders responsive cols variant", () => {
    const { container } = render(
      <BentoGrid cols={{ base: 1, md: 2 }}>
        <BentoTile span="half">
          <BentoTileBody>
            <span>Tile A</span>
          </BentoTileBody>
        </BentoTile>
        <BentoTile span="half">
          <BentoTileBody>
            <span>Tile B</span>
          </BentoTileBody>
        </BentoTile>
      </BentoGrid>
    )
    const grid = container.querySelector("[data-slot='bento-grid']") as HTMLElement
    expect(grid.style.getPropertyValue("--bento-cols")).toBe("1")
    expect(grid.style.getPropertyValue("--bento-cols-md")).toBe("2")
  })
})
