import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "../breadcrumb"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Breadcrumb", () => {
  it("renders a breadcrumb nav", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Current Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
    expect(screen.getByRole("navigation", { name: "breadcrumb" })).toBeInTheDocument()
    expect(screen.getByText("Home")).toBeInTheDocument()
    expect(screen.getByText("Current Page")).toBeInTheDocument()
  })

  it("Breadcrumb has aria-label", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
    const nav = screen.getByRole("navigation")
    expect(nav).toHaveAttribute("aria-label", "breadcrumb")
    expect(nav).toHaveAttribute("data-slot", "breadcrumb")
  })

  it("BreadcrumbLink renders as anchor", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/about">About</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
    const link = screen.getByRole("link", { name: "About" })
    expect(link).toHaveAttribute("href", "/about")
    expect(link).toHaveAttribute("data-slot", "breadcrumb-link")
  })

  it("BreadcrumbPage has correct accessibility attributes", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Current</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
    const page = screen.getByText("Current")
    expect(page).toHaveAttribute("aria-current", "page")
    expect(page).toHaveAttribute("aria-disabled", "true")
    expect(page).toHaveAttribute("data-slot", "breadcrumb-page")
  })

  it("BreadcrumbSeparator is hidden from screen readers", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator data-testid="separator" />
        </BreadcrumbList>
      </Breadcrumb>
    )
    const sep = screen.getByTestId("separator")
    expect(sep).toHaveAttribute("aria-hidden", "true")
    expect(sep).toHaveAttribute("data-slot", "breadcrumb-separator")
  })

  it("BreadcrumbSeparator renders custom children", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
        </BreadcrumbList>
      </Breadcrumb>
    )
    expect(screen.getByText("/")).toBeInTheDocument()
  })

  it("BreadcrumbEllipsis renders with sr-only text", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
    expect(screen.getByText("More")).toBeInTheDocument()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Current Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
    await checkA11y(container)
  })
})
