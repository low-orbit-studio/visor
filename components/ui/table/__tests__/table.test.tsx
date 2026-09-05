import { readFileSync } from "fs"
import { resolve } from "path"
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "../table"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Table", () => {
  it("renders a table with all sub-components", () => {
    render(
      <Table>
        <TableCaption>User data</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Alice</TableCell>
            <TableCell>alice@example.com</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell>1 user</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    )

    expect(screen.getByText("Name")).toBeInTheDocument()
    expect(screen.getByText("Email")).toBeInTheDocument()
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("alice@example.com")).toBeInTheDocument()
    expect(screen.getByText("User data")).toBeInTheDocument()
    expect(screen.getByText("Total")).toBeInTheDocument()
  })

  it("Table has data-slot attribute", () => {
    render(
      <Table data-testid="my-table">
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByRole("table")).toHaveAttribute("data-slot", "table")
  })

  it("TableHeader has data-slot attribute", () => {
    render(
      <Table>
        <TableHeader data-testid="thead">
          <TableRow>
            <TableHead>Head</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByTestId("thead")).toHaveAttribute("data-slot", "table-header")
  })

  it("TableBody has data-slot attribute", () => {
    render(
      <Table>
        <TableBody data-testid="tbody">
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByTestId("tbody")).toHaveAttribute("data-slot", "table-body")
  })

  it("TableFooter has data-slot attribute", () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter data-testid="tfoot">
          <TableRow>
            <TableCell>Footer</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    )
    expect(screen.getByTestId("tfoot")).toHaveAttribute("data-slot", "table-footer")
  })

  it("TableRow has data-slot attribute", () => {
    render(
      <Table>
        <TableBody>
          <TableRow data-testid="tr">
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByTestId("tr")).toHaveAttribute("data-slot", "table-row")
  })

  it("TableHead has data-slot and scope attributes", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead data-testid="th">Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Alice</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    const th = screen.getByTestId("th")
    expect(th).toHaveAttribute("data-slot", "table-head")
    expect(th).toHaveAttribute("scope", "col")
  })

  it("TableHead accepts custom scope", () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableHead scope="row" data-testid="th-row">Row header</TableHead>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByTestId("th-row")).toHaveAttribute("scope", "row")
  })

  it("TableCell has data-slot attribute", () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell data-testid="td">Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByTestId("td")).toHaveAttribute("data-slot", "table-cell")
  })

  it("TableCaption has data-slot attribute", () => {
    render(
      <Table>
        <TableCaption data-testid="caption">Caption text</TableCaption>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByTestId("caption")).toHaveAttribute("data-slot", "table-caption")
  })

  it("accepts custom className", () => {
    render(
      <Table className="custom-class" data-testid="table-wrapper">
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByRole("table")).toHaveClass("custom-class")
  })

  it("forwards ref to table element", () => {
    const ref = { current: null }
    render(
      <Table ref={ref}>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(ref.current).toBeInstanceOf(HTMLTableElement)
  })
})

describe("Table accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <Table>
        <TableCaption>Monthly sales data</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Month</TableHead>
            <TableHead scope="col">Sales</TableHead>
            <TableHead scope="col">Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>January</TableCell>
            <TableCell>120</TableCell>
            <TableCell>$12,000</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>February</TableCell>
            <TableCell>98</TableCell>
            <TableCell>$9,800</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell>218</TableCell>
            <TableCell>$21,800</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    )
    await checkA11y(container)
  })
})

describe("editorial token hooks (CSS-only, additive, zero-regression)", () => {
  const css = readFileSync(
    resolve(__dirname, "..", "table.module.css"),
    "utf-8"
  )

  it("container radius wraps --dt-container-radius, defaulting to var(--radius-lg, 0.5rem)", () => {
    expect(css).toContain(
      "border-radius: var(--dt-container-radius, var(--radius-lg, 0.5rem));"
    )
  })

  it("container shadow wraps --dt-container-shadow, defaulting to var(--shadow-sm)", () => {
    expect(css).toContain(
      "box-shadow: var(--dt-container-shadow, var(--shadow-sm));"
    )
  })

  // VI-625 put a component-scoped --table-head-bg / --table-cell-bg in front of
  // the shared --dt-* surface roles. The dt role stays the default, so an
  // unbound theme resolves to the same `transparent` it always did — the fill
  // just gained a per-component dial above the shared one.
  it("TableHead background-color layers --table-head-bg over --dt-header-bg, defaulting to transparent", () => {
    expect(css).toContain(
      "background-color: var(--table-head-bg, var(--dt-header-bg, transparent));"
    )
  })

  it("TableCell background-color layers --table-cell-bg over --dt-row-bg, defaulting to transparent", () => {
    expect(css).toContain(
      "background-color: var(--table-cell-bg, var(--dt-row-bg, transparent));"
    )
  })
})
