import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "../pagination"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Pagination", () => {
  it("renders nav with aria-label", () => {
    render(
      <Pagination data-testid="pagination">
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
    const nav = screen.getByTestId("pagination")
    expect(nav).toHaveAttribute("aria-label", "pagination")
    expect(nav).toHaveAttribute("role", "navigation")
    expect(nav).toHaveAttribute("data-slot", "pagination")
  })

  it("renders pagination content as a list", () => {
    const { container } = render(
      <Pagination>
        <PaginationContent data-testid="content">
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
    const list = screen.getByTestId("content")
    expect(list.tagName).toBe("UL")
    expect(list).toHaveAttribute("data-slot", "pagination-content")
  })

  it("PaginationLink sets aria-current when active", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#" isActive>
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">2</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
    expect(screen.getByText("1")).toHaveAttribute("aria-current", "page")
    expect(screen.getByText("2")).not.toHaveAttribute("aria-current")
  })

  it("PaginationPrevious renders icon and text", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" data-testid="prev" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
    const prev = screen.getByTestId("prev")
    expect(prev).toHaveAttribute("data-slot", "pagination-previous")
    expect(prev).toHaveAttribute("aria-label", "Go to previous page")
    expect(screen.getByText("Previous")).toBeInTheDocument()
  })

  it("PaginationNext renders icon and text", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationNext href="#" data-testid="next" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
    const next = screen.getByTestId("next")
    expect(next).toHaveAttribute("data-slot", "pagination-next")
    expect(next).toHaveAttribute("aria-label", "Go to next page")
    expect(screen.getByText("Next")).toBeInTheDocument()
  })

  it("PaginationEllipsis is hidden from screen readers", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationEllipsis data-testid="ellipsis" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
    const ellipsis = screen.getByTestId("ellipsis")
    expect(ellipsis).toHaveAttribute("aria-hidden", "true")
    expect(ellipsis).toHaveAttribute("data-slot", "pagination-ellipsis")
  })

  it("supports custom className on all sub-components", () => {
    render(
      <Pagination className="custom-nav" data-testid="nav">
        <PaginationContent className="custom-list" data-testid="list">
          <PaginationItem className="custom-item" data-testid="item">
            <PaginationLink href="#" className="custom-link" data-testid="link">
              1
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
    expect(screen.getByTestId("nav")).toHaveClass("custom-nav")
    expect(screen.getByTestId("list")).toHaveClass("custom-list")
    expect(screen.getByTestId("item")).toHaveClass("custom-item")
    expect(screen.getByTestId("link")).toHaveClass("custom-link")
  })

  it("forwards ref on Pagination", () => {
    const ref = { current: null } as React.RefObject<HTMLElement | null>
    render(
      <Pagination ref={ref}>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("NAV")
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">3</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
    await checkA11y(container)
  })
})
