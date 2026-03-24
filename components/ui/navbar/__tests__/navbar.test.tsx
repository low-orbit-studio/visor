import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarLink,
  NavbarToggle,
} from "../navbar"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Navbar", () => {
  it("renders nav with aria-label", () => {
    render(
      <Navbar data-testid="navbar">
        <NavbarBrand>Brand</NavbarBrand>
      </Navbar>
    )
    const nav = screen.getByTestId("navbar")
    expect(nav.tagName).toBe("NAV")
    expect(nav).toHaveAttribute("aria-label", "main")
    expect(nav).toHaveAttribute("data-slot", "navbar")
  })

  it("renders default variant by default", () => {
    const { container } = render(
      <Navbar>
        <NavbarBrand>Brand</NavbarBrand>
      </Navbar>
    )
    const nav = container.querySelector('[data-slot="navbar"]')
    expect(nav).toHaveClass("variantDefault")
  })

  it("renders transparent variant", () => {
    const { container } = render(
      <Navbar variant="transparent">
        <NavbarBrand>Brand</NavbarBrand>
      </Navbar>
    )
    const nav = container.querySelector('[data-slot="navbar"]')
    expect(nav).toHaveClass("variantTransparent")
  })

  it("renders bordered variant", () => {
    const { container } = render(
      <Navbar variant="bordered">
        <NavbarBrand>Brand</NavbarBrand>
      </Navbar>
    )
    const nav = container.querySelector('[data-slot="navbar"]')
    expect(nav).toHaveClass("variantBordered")
  })

  it("NavbarBrand renders with data-slot", () => {
    render(
      <Navbar>
        <NavbarBrand data-testid="brand">Brand</NavbarBrand>
      </Navbar>
    )
    expect(screen.getByTestId("brand")).toHaveAttribute("data-slot", "navbar-brand")
  })

  it("NavbarContent renders with alignment", () => {
    render(
      <Navbar>
        <NavbarContent data-testid="content-start" align="start">
          Links
        </NavbarContent>
        <NavbarContent data-testid="content-end" align="end">
          Actions
        </NavbarContent>
      </Navbar>
    )
    expect(screen.getByTestId("content-start")).toHaveClass("contentStart")
    expect(screen.getByTestId("content-end")).toHaveClass("contentEnd")
  })

  it("NavbarContent defaults to start alignment", () => {
    render(
      <Navbar>
        <NavbarContent data-testid="content">Links</NavbarContent>
      </Navbar>
    )
    expect(screen.getByTestId("content")).toHaveClass("contentStart")
  })

  it("NavbarItem renders with data-slot", () => {
    render(
      <Navbar>
        <NavbarContent>
          <NavbarItem data-testid="item">Item</NavbarItem>
        </NavbarContent>
      </Navbar>
    )
    expect(screen.getByTestId("item")).toHaveAttribute("data-slot", "navbar-item")
  })

  it("NavbarLink sets aria-current when active", () => {
    render(
      <Navbar>
        <NavbarContent>
          <NavbarItem>
            <NavbarLink href="#" isActive>
              Active
            </NavbarLink>
          </NavbarItem>
          <NavbarItem>
            <NavbarLink href="#">Inactive</NavbarLink>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
    )
    expect(screen.getByText("Active")).toHaveAttribute("aria-current", "page")
    expect(screen.getByText("Inactive")).not.toHaveAttribute("aria-current")
  })

  it("NavbarLink active state adds active class", () => {
    render(
      <Navbar>
        <NavbarContent>
          <NavbarItem>
            <NavbarLink href="#" isActive data-testid="active-link">
              Active
            </NavbarLink>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
    )
    expect(screen.getByTestId("active-link")).toHaveClass("linkActive")
  })

  it("NavbarToggle has aria-label", () => {
    render(
      <Navbar>
        <NavbarToggle data-testid="toggle" />
      </Navbar>
    )
    const toggle = screen.getByTestId("toggle")
    expect(toggle).toHaveAttribute("aria-label", "Toggle navigation")
    expect(toggle).toHaveAttribute("data-slot", "navbar-toggle")
  })

  it("supports custom className", () => {
    render(
      <Navbar className="custom-nav" data-testid="nav">
        <NavbarBrand className="custom-brand" data-testid="brand">
          Brand
        </NavbarBrand>
      </Navbar>
    )
    expect(screen.getByTestId("nav")).toHaveClass("custom-nav")
    expect(screen.getByTestId("brand")).toHaveClass("custom-brand")
  })

  it("forwards ref on Navbar", () => {
    const ref = { current: null } as React.RefObject<HTMLElement | null>
    render(
      <Navbar ref={ref}>
        <NavbarBrand>Brand</NavbarBrand>
      </Navbar>
    )
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("NAV")
  })

  it("allows overriding aria-label", () => {
    render(
      <Navbar aria-label="site navigation" data-testid="nav">
        <NavbarBrand>Brand</NavbarBrand>
      </Navbar>
    )
    expect(screen.getByTestId("nav")).toHaveAttribute("aria-label", "site navigation")
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <Navbar>
        <NavbarBrand>Visor</NavbarBrand>
        <NavbarContent>
          <NavbarItem>
            <NavbarLink href="#" isActive>
              Home
            </NavbarLink>
          </NavbarItem>
          <NavbarItem>
            <NavbarLink href="#">About</NavbarLink>
          </NavbarItem>
          <NavbarItem>
            <NavbarLink href="#">Contact</NavbarLink>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
    )
    await checkA11y(container)
  })
})
