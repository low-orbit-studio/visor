import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { checkA11y } from "../../../test-utils/a11y"
import { FooterSection } from "../footer-section"
import type { LinkGroup } from "../footer-section"

const mockLinkGroups: LinkGroup[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "GitHub", href: "https://github.com", external: true },
    ],
  },
]

const mockLogo = <span data-testid="logo">MyLogo</span>

describe("FooterSection", () => {
  // ─── Rendering ──────────────────────────────────────────────────────

  it("renders without crashing", () => {
    const { container } = render(
      <FooterSection linkGroups={mockLinkGroups} />
    )
    expect(container.querySelector("footer")).toBeInTheDocument()
  })

  it("renders the logo when provided", () => {
    render(<FooterSection logo={mockLogo} linkGroups={mockLinkGroups} />)
    expect(screen.getByTestId("logo")).toBeInTheDocument()
  })

  it("does not render logo area when logo is omitted", () => {
    render(<FooterSection linkGroups={mockLinkGroups} />)
    expect(screen.queryByTestId("logo")).not.toBeInTheDocument()
  })

  it("renders the tagline when provided", () => {
    render(
      <FooterSection
        linkGroups={mockLinkGroups}
        tagline="Build beautiful interfaces faster."
      />
    )
    expect(screen.getByText("Build beautiful interfaces faster.")).toBeInTheDocument()
  })

  it("does not render tagline when omitted", () => {
    const { container } = render(<FooterSection linkGroups={mockLinkGroups} />)
    // tagline is rendered as a <p> — if not provided, it should not be in the brand section
    expect(container.querySelector("p")).not.toBeInTheDocument()
  })

  // ─── Link Groups ─────────────────────────────────────────────────────

  it("renders all link group headings", () => {
    render(<FooterSection linkGroups={mockLinkGroups} />)
    expect(screen.getByText("Product")).toBeInTheDocument()
    expect(screen.getByText("Company")).toBeInTheDocument()
  })

  it("renders all links with correct hrefs", () => {
    render(<FooterSection linkGroups={mockLinkGroups} />)
    expect(screen.getByRole("link", { name: "Features" })).toHaveAttribute("href", "/features")
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "/pricing")
    expect(screen.getByRole("link", { name: "Changelog" })).toHaveAttribute("href", "/changelog")
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "/about")
    expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute("href", "/blog")
  })

  // ─── External Links ───────────────────────────────────────────────────

  it("renders external links with target and rel attributes", () => {
    render(<FooterSection linkGroups={mockLinkGroups} />)
    const githubLink = screen.getByRole("link", { name: "GitHub" })
    expect(githubLink).toHaveAttribute("target", "_blank")
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("does not add target/rel to internal links", () => {
    render(<FooterSection linkGroups={mockLinkGroups} />)
    const featuresLink = screen.getByRole("link", { name: "Features" })
    expect(featuresLink).not.toHaveAttribute("target")
    expect(featuresLink).not.toHaveAttribute("rel")
  })

  // ─── Copyright ───────────────────────────────────────────────────────

  it("renders default copyright with current year", () => {
    render(<FooterSection linkGroups={mockLinkGroups} />)
    const year = new Date().getFullYear()
    expect(screen.getByText(`© ${year}`)).toBeInTheDocument()
  })

  it("renders custom copyright when provided", () => {
    render(
      <FooterSection
        linkGroups={mockLinkGroups}
        copyright="© 2025 Acme Corp. All rights reserved."
      />
    )
    expect(screen.getByText("© 2025 Acme Corp. All rights reserved.")).toBeInTheDocument()
  })

  // ─── bottomContent slot ───────────────────────────────────────────────

  it("renders bottomContent when provided", () => {
    render(
      <FooterSection
        linkGroups={mockLinkGroups}
        bottomContent={<div data-testid="bottom-content">Social Icons</div>}
      />
    )
    expect(screen.getByTestId("bottom-content")).toBeInTheDocument()
  })

  it("does not render bottomContent area when omitted", () => {
    render(<FooterSection linkGroups={mockLinkGroups} />)
    expect(screen.queryByTestId("bottom-content")).not.toBeInTheDocument()
  })

  // ─── className passthrough ───────────────────────────────────────────

  it("applies custom className to the root element", () => {
    const { container } = render(
      <FooterSection linkGroups={mockLinkGroups} className="custom-footer" />
    )
    expect(container.querySelector("footer")).toHaveClass("custom-footer")
  })

  // ─── Semantic HTML ───────────────────────────────────────────────────

  it("uses a <footer> element as root", () => {
    const { container } = render(<FooterSection linkGroups={mockLinkGroups} />)
    expect(container.querySelector("footer")).toBeInTheDocument()
  })

  it("wraps each link group in a <nav> element", () => {
    const { container } = render(<FooterSection linkGroups={mockLinkGroups} />)
    const navElements = container.querySelectorAll("nav")
    expect(navElements).toHaveLength(2)
  })

  it("renders copyright in a <small> element", () => {
    const { container } = render(<FooterSection linkGroups={mockLinkGroups} />)
    expect(container.querySelector("small")).toBeInTheDocument()
  })

  // ─── A11y ───────────────────────────────────────────────────────────

  it("passes accessibility checks", async () => {
    const { container } = render(
      <FooterSection
        logo={mockLogo}
        tagline="Build beautiful interfaces faster."
        linkGroups={mockLinkGroups}
        copyright="© 2025 Visor. All rights reserved."
      />
    )
    await checkA11y(container)
  })

  it("passes accessibility checks with bottomContent", async () => {
    const { container } = render(
      <FooterSection
        logo={mockLogo}
        tagline="Build beautiful interfaces faster."
        linkGroups={mockLinkGroups}
        bottomContent={<div>Social Icons</div>}
      />
    )
    await checkA11y(container)
  })
})
