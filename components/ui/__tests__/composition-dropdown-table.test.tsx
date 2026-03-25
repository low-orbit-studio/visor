import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../table/table"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../dropdown-menu/dropdown-menu"
import { Button } from "../button/button"
import { checkA11y } from "../../../test-utils/a11y"

const users = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
  { id: 3, name: "Carol", email: "carol@example.com" },
]

function TableWithDropdowns({ openRow }: { openRow?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead scope="col">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <DropdownMenu open={openRow === user.id ? true : undefined}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid={`actions-${user.id}`}>
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

describe("Composition: Dropdown in Table", () => {
  it("renders table rows with dropdown action triggers", () => {
    render(<TableWithDropdowns />)
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
    expect(screen.getByText("Carol")).toBeInTheDocument()
    const actionButtons = screen.getAllByRole("button", { name: "Actions" })
    expect(actionButtons).toHaveLength(3)
  })

  it("dropdown triggers have correct data-slot in table cells", () => {
    render(<TableWithDropdowns />)
    const trigger = screen.getByTestId("actions-1")
    expect(trigger).toHaveAttribute("data-slot", "dropdown-menu-trigger")
  })

  it("dropdown opens from table cell showing menu items", () => {
    render(<TableWithDropdowns openRow={1} />)
    expect(screen.getByText("Edit")).toBeInTheDocument()
    expect(screen.getByText("Duplicate")).toBeInTheDocument()
    expect(screen.getByText("Delete")).toBeInTheDocument()
  })

  it("each row has its own independent dropdown trigger", () => {
    render(<TableWithDropdowns />)
    const trigger1 = screen.getByTestId("actions-1")
    const trigger2 = screen.getByTestId("actions-2")
    const trigger3 = screen.getByTestId("actions-3")
    expect(trigger1).not.toBe(trigger2)
    expect(trigger2).not.toBe(trigger3)
  })

  it("destructive dropdown item renders in table context", () => {
    render(<TableWithDropdowns openRow={2} />)
    const deleteItem = screen.getByText("Delete")
    expect(deleteItem).toHaveAttribute("data-variant", "destructive")
  })

  it("table structure is preserved with dropdown components", () => {
    render(<TableWithDropdowns />)
    expect(screen.getByRole("table")).toBeInTheDocument()
    expect(screen.getAllByRole("row")).toHaveLength(4) // 1 header + 3 body
    expect(screen.getAllByRole("columnheader")).toHaveLength(3)
  })
})

describe("Composition: Dropdown in Table accessibility", () => {
  it("has no WCAG 2.1 AA violations (closed dropdowns)", async () => {
    const { container } = render(<TableWithDropdowns />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (open dropdown)", async () => {
    const { container } = render(<TableWithDropdowns openRow={1} />)
    await checkA11y(container)
  })
})
