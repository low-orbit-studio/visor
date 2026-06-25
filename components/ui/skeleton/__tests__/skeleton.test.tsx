import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Skeleton, SkeletonList, SkeletonTable, SkeletonDetail } from "../skeleton"
import styles from "../skeleton.module.css"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Skeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveAttribute("data-slot", "skeleton")
  })

  it("renders with custom className", () => {
    const { container } = render(<Skeleton className="custom-skeleton" />)
    expect(container.firstChild).toHaveClass("custom-skeleton")
  })

  it("accepts width and height styles", () => {
    const { container } = render(
      <Skeleton style={{ width: "100px", height: "20px" }} />
    )
    const el = container.firstChild as HTMLElement
    expect(el.style.width).toBe("100px")
    expect(el.style.height).toBe("20px")
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<Skeleton ref={ref} />)
    expect(ref.current).not.toBeNull()
  })

  it("renders as a div element", () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild?.nodeName).toBe("DIV")
  })

  it("applies no shape modifier class by default", () => {
    const { container } = render(<Skeleton />)
    const el = container.firstChild as HTMLElement
    expect(el.className).not.toMatch(/shapePill|shapeLogo|shapeCircle/)
  })

  it("accepts shape modifier classes via className", () => {
    // Shape variants are CSS-only — consumers opt in via className using the
    // exported module classes. The base .skeleton class is retained.
    const { container } = render(
      <Skeleton className={styles.shapePill} />
    )
    const el = container.firstChild as HTMLElement
    expect(el).toHaveClass(styles.skeleton)
    expect(el).toHaveClass(styles.shapePill)
  })

  it("exposes shapeLogo, shapePill, and shapeCircle modifier classes", () => {
    expect(styles.shapeLogo).toBeTruthy()
    expect(styles.shapePill).toBeTruthy()
    expect(styles.shapeCircle).toBeTruthy()
  })
})

describe("SkeletonList", () => {
  it("renders without crashing", () => {
    render(<SkeletonList />)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<SkeletonList />)
    expect(screen.getByRole("status")).toHaveAttribute("data-slot", "skeleton-list")
  })

  it("renders the default count of 3 rows", () => {
    const { container } = render(<SkeletonList />)
    // Each row contains an avatar, two text lines, and a badge = 4 skeleton blocks
    const rows = container.querySelectorAll("[class*='skeletonListRow']")
    expect(rows).toHaveLength(3)
  })

  it("renders the specified count of rows", () => {
    const { container } = render(<SkeletonList count={5} />)
    const rows = container.querySelectorAll("[class*='skeletonListRow']")
    expect(rows).toHaveLength(5)
  })

  it("has aria-label for screen readers", () => {
    render(<SkeletonList />)
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading list")
  })

  it("accepts custom className", () => {
    render(<SkeletonList className="custom" />)
    expect(screen.getByRole("status")).toHaveClass("custom")
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<SkeletonList ref={ref} />)
    expect(ref.current).not.toBeNull()
  })
})

describe("SkeletonTable", () => {
  it("renders without crashing", () => {
    render(<SkeletonTable />)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<SkeletonTable />)
    expect(screen.getByRole("status")).toHaveAttribute("data-slot", "skeleton-table")
  })

  it("renders the default 4 rows", () => {
    const { container } = render(<SkeletonTable />)
    const rows = container.querySelectorAll("[class*='skeletonTableRow']")
    expect(rows).toHaveLength(4)
  })

  it("renders the specified number of rows", () => {
    const { container } = render(<SkeletonTable rows={6} columns={3} />)
    const rows = container.querySelectorAll("[class*='skeletonTableRow']")
    expect(rows).toHaveLength(6)
  })

  it("renders the default 4 cells per row", () => {
    const { container } = render(<SkeletonTable rows={1} />)
    const cells = container.querySelectorAll("[class*='skeletonTableCell']")
    expect(cells).toHaveLength(4)
  })

  it("renders the specified number of columns", () => {
    const { container } = render(<SkeletonTable rows={1} columns={6} />)
    const cells = container.querySelectorAll("[class*='skeletonTableCell']")
    expect(cells).toHaveLength(6)
  })

  it("has aria-label for screen readers", () => {
    render(<SkeletonTable />)
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading table")
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<SkeletonTable ref={ref} />)
    expect(ref.current).not.toBeNull()
  })
})

describe("SkeletonDetail", () => {
  it("renders without crashing", () => {
    render(<SkeletonDetail />)
    expect(screen.getByRole("status")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    render(<SkeletonDetail />)
    expect(screen.getByRole("status")).toHaveAttribute("data-slot", "skeleton-detail")
  })

  it("has aria-label for screen readers", () => {
    render(<SkeletonDetail />)
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading detail")
  })

  it("renders the default 3 body lines", () => {
    // The detail renders: 1 avatar, 1 heading, plus `lines` body lines inside
    // the content column. Query the content div's direct children (heading + body lines).
    const { container } = render(<SkeletonDetail lines={3} />)
    const contentBlock = container.querySelector("[class*='skeletonDetailContent']")
    expect(contentBlock?.children).toHaveLength(4) // 1 heading + 3 body lines
  })

  it("renders the specified number of body lines", () => {
    const { container } = render(<SkeletonDetail lines={5} />)
    const contentBlock = container.querySelector("[class*='skeletonDetailContent']")
    expect(contentBlock?.children).toHaveLength(6) // 1 heading + 5 body lines
  })

  it("accepts custom className", () => {
    render(<SkeletonDetail className="custom" />)
    expect(screen.getByRole("status")).toHaveClass("custom")
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<SkeletonDetail ref={ref} />)
    expect(ref.current).not.toBeNull()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (aria-hidden skeleton)", async () => {
    // Skeletons are decorative loading placeholders; hide from AT with aria-hidden
    const { container } = render(
      <div>
        <p>Loading...</p>
        <Skeleton aria-hidden="true" style={{ width: "200px", height: "20px" }} />
      </div>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (SkeletonList with role=status)", async () => {
    const { container } = render(<SkeletonList count={2} />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (SkeletonTable with role=status)", async () => {
    const { container } = render(<SkeletonTable rows={2} columns={3} />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (SkeletonDetail with role=status)", async () => {
    const { container } = render(<SkeletonDetail lines={2} />)
    await checkA11y(container)
  })
})
