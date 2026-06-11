import * as React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { UsersIcon, ShieldIcon } from "@phosphor-icons/react"
import { SectionNav, SectionNavItem } from "../section-nav"
import { checkA11y } from "../../../../test-utils/a11y"

describe("SectionNav", () => {
  it("renders a nav landmark with a default aria-label", () => {
    render(
      <SectionNav data-testid="nav">
        <SectionNavItem href="#" label="Detail" />
      </SectionNav>
    )
    const nav = screen.getByTestId("nav")
    expect(nav.tagName).toBe("NAV")
    expect(nav).toHaveAttribute("aria-label", "section")
    expect(nav).toHaveAttribute("data-slot", "section-nav")
  })

  it("allows overriding aria-label", () => {
    render(
      <SectionNav aria-label="organization sections" data-testid="nav">
        <SectionNavItem href="#" label="Detail" />
      </SectionNav>
    )
    expect(screen.getByTestId("nav")).toHaveAttribute(
      "aria-label",
      "organization sections"
    )
  })

  it("renders an item as an anchor with its href and label", () => {
    render(
      <SectionNav>
        <SectionNavItem href="/detail" label="Detail" />
      </SectionNav>
    )
    const link = screen.getByRole("link", { name: "Detail" })
    expect(link).toHaveAttribute("href", "/detail")
    expect(link).toHaveAttribute("data-slot", "section-nav-item")
  })

  it("renders a leading icon when provided as a component (canonical form)", () => {
    const { container } = render(
      <SectionNav>
        <SectionNavItem href="#" label="Members" icon={UsersIcon} />
      </SectionNav>
    )
    // Phosphor icons render an <svg> with aria-hidden; assert one is present.
    const svg = container.querySelector("svg[aria-hidden='true']")
    expect(svg).toBeInTheDocument()
    // Component form applies the icon slot class directly to the svg.
    expect(svg).toHaveClass("icon")
  })

  it("renders a leading icon when provided as a rendered element (as-is)", () => {
    render(
      <SectionNav>
        <SectionNavItem
          href="#"
          label="Members"
          icon={<span data-testid="el-icon">★</span>}
        />
      </SectionNav>
    )
    const el = screen.getByTestId("el-icon")
    // The exact element is rendered, preserving its content.
    expect(el).toBeInTheDocument()
    expect(el).toHaveTextContent("★")
    // Wrapped in the icon slot span so styling is unchanged.
    expect(el.parentElement).toHaveClass("icon")
  })

  it("preserves an element-style Phosphor icon's own size and weight props", () => {
    const { container } = render(
      <SectionNav>
        <SectionNavItem
          href="#"
          label="Members"
          icon={<UsersIcon size={16} weight="bold" />}
        />
      </SectionNav>
    )
    // The element renders as-is, wrapped in the icon slot span: the svg keeps
    // its own size={16} (not the canonical 1rem class sizing).
    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute("width", "16")
    expect(svg).toHaveAttribute("height", "16")
    expect(svg?.parentElement).toHaveClass("icon")

    // The element's own `weight="bold"` flows through: a bold-weight Phosphor
    // icon renders different path geometry than the canonical weight="regular".
    const regular = render(<UsersIcon size={16} weight="regular" />)
    expect(svg?.innerHTML).not.toBe(
      regular.container.querySelector("svg")?.innerHTML
    )
  })

  it("renders a trailing count pill, including zero", () => {
    render(
      <SectionNav>
        <SectionNavItem href="#" label="Roles" count={5} />
        <SectionNavItem href="#" label="Invites" count={0} />
      </SectionNav>
    )
    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it("omits the count pill when count is undefined", () => {
    render(
      <SectionNav>
        <SectionNavItem href="#" label="Detail" />
      </SectionNav>
    )
    const link = screen.getByRole("link", { name: "Detail" })
    // No numeric pill text inside the link
    expect(link.textContent).toBe("Detail")
  })

  it("marks the active item with aria-current and the active class", () => {
    render(
      <SectionNav>
        <SectionNavItem href="#" label="Detail" isActive />
        <SectionNavItem href="#" label="Roles" />
      </SectionNav>
    )
    const active = screen.getByRole("link", { name: "Detail" })
    const inactive = screen.getByRole("link", { name: "Roles" })
    expect(active).toHaveAttribute("aria-current", "page")
    expect(active).toHaveAttribute("data-active", "true")
    expect(active).toHaveClass("itemActive")
    expect(inactive).not.toHaveAttribute("aria-current")
    expect(inactive).not.toHaveAttribute("data-active")
  })

  it("re-tones the count pill from neutral to primary on the active item", () => {
    render(
      <SectionNav>
        <SectionNavItem href="#" label="Detail" count={3} isActive />
        <SectionNavItem href="#" label="Roles" count={7} />
      </SectionNav>
    )
    expect(screen.getByText("3")).toHaveClass("countActive")
    expect(screen.getByText("7")).toHaveClass("countNeutral")
  })

  it("supports asChild to merge chrome onto a custom link element (next/link pattern)", () => {
    // Stand-in for next/link: a component that renders an <a>.
    const Link = React.forwardRef<
      HTMLAnchorElement,
      React.ComponentProps<"a"> & { href: string }
    >(({ href, ...rest }, ref) => <a ref={ref} href={href} {...rest} />)
    Link.displayName = "Link"

    render(
      <SectionNav>
        <SectionNavItem asChild label="Members" count={4} isActive icon={ShieldIcon}>
          <Link href="/members" />
        </SectionNavItem>
      </SectionNav>
    )
    const link = screen.getByRole("link", { name: /Members/ })
    expect(link).toHaveAttribute("href", "/members")
    expect(link).toHaveAttribute("aria-current", "page")
    expect(link).toHaveClass("itemActive")
    // Chrome (label + count) rendered inside the slotted anchor.
    expect(link).toHaveTextContent("Members")
    expect(link).toHaveTextContent("4")
  })

  it("forwards className and ref on the item", () => {
    const ref = { current: null } as React.RefObject<HTMLAnchorElement | null>
    render(
      <SectionNav>
        <SectionNavItem ref={ref} href="#" label="Detail" className="custom" />
      </SectionNav>
    )
    const link = screen.getByRole("link", { name: "Detail" })
    expect(link).toHaveClass("custom")
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("A")
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <SectionNav>
        <SectionNavItem href="#" label="Detail" icon={UsersIcon} count={3} isActive />
        <SectionNavItem href="#" label="Roles" icon={ShieldIcon} count={7} />
        <SectionNavItem href="#" label="Invites" count={0} />
      </SectionNav>
    )
    await checkA11y(container)
  })
})
