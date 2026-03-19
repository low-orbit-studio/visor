import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select"

describe("Select", () => {
  it("renders trigger with placeholder", () => {
    render(
      <Select>
        <SelectTrigger aria-label="Choose option">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(screen.getByText("Select an option")).toBeInTheDocument()
  })

  it("renders trigger with custom className", () => {
    render(
      <Select>
        <SelectTrigger className="custom-class" aria-label="Choose">
          <SelectValue placeholder="Choose..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    )
    const trigger = screen.getByRole("combobox")
    expect(trigger).toHaveClass("custom-class")
  })

  it("renders trigger as disabled when disabled prop is set", () => {
    render(
      <Select>
        <SelectTrigger disabled aria-label="Choose">
          <SelectValue placeholder="Choose..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    )
    const trigger = screen.getByRole("combobox")
    expect(trigger).toBeDisabled()
  })

  it("shows selected value", () => {
    render(
      <Select defaultValue="option1">
        <SelectTrigger aria-label="Choose option">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(screen.getByText("Option 1")).toBeInTheDocument()
  })

  it("renders as a combobox", () => {
    render(
      <Select>
        <SelectTrigger aria-label="Choose">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(screen.getByRole("combobox")).toBeInTheDocument()
  })
})
