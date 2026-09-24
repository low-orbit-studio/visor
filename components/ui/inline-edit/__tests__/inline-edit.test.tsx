import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { InlineEdit, type InlineEditProps } from "../inline-edit"
import styles from "../inline-edit.module.css"
import { checkA11y } from "../../../../test-utils/a11y"

/** A parent that owns `value`, the way a consumer does. */
function Harness({ initial = "Technical rider", onCommit, ...props }: Partial<InlineEditProps> & { initial?: string }) {
  const [value, setValue] = React.useState(initial)
  return (
    <>
      <InlineEdit
        label="Rider title"
        defaultValue="Rider"
        {...props}
        value={value}
        onCommit={(next) => {
          onCommit?.(next)
          setValue(next)
        }}
      />
      <button type="button">Next field</button>
    </>
  )
}

const pencil = () => screen.getByRole("button", { name: "Edit Rider title" })
const input = () => screen.getByRole("textbox", { name: "Rider title" })

describe("InlineEdit (VI-658)", () => {
  it("rests as the text and a labelled pencil, with no input", () => {
    render(<Harness />)
    expect(screen.getByText("Technical rider")).toBeInTheDocument()
    expect(pencil()).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).toBeNull()
  })

  it("a click on the pencil opens the input in place, holding the value, selected and focused", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(pencil())
    expect(input()).toHaveValue("Technical rider")
    expect(input()).toHaveFocus()
    expect((input() as HTMLInputElement).selectionStart).toBe(0)
    expect((input() as HTMLInputElement).selectionEnd).toBe("Technical rider".length)
  })

  it("a click on the text opens it too", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByText("Technical rider"))
    expect(input()).toHaveFocus()
  })

  it("Enter on the pencil opens it", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    pencil().focus()
    await user.keyboard("{Enter}")
    expect(input()).toHaveFocus()
  })

  it("Enter commits, and focus returns to the pencil", async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    render(<Harness onCommit={onCommit} />)
    await user.click(pencil())
    await user.clear(input())
    await user.type(input(), "Hospitality rider{Enter}")
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith("Hospitality rider")
    expect(screen.getByText("Hospitality rider")).toBeInTheDocument()
    expect(pencil()).toHaveFocus()
  })

  it("blur commits", async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    render(<Harness onCommit={onCommit} />)
    await user.click(pencil())
    await user.clear(input())
    await user.type(input(), "Stage plot")
    await user.click(document.body)
    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith("Stage plot")
    expect(screen.getByText("Stage plot")).toBeInTheDocument()
  })

  it("Tab commits and moves on to the next field", async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    render(<Harness onCommit={onCommit} />)
    await user.click(pencil())
    await user.type(input(), " v2")
    await user.tab()
    expect(onCommit).toHaveBeenCalledWith("Technical rider v2")
    expect(screen.getByRole("button", { name: "Next field" })).toHaveFocus()
  })

  it("Escape restores the value without committing, and focus returns to the pencil", async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    render(<Harness onCommit={onCommit} />)
    await user.click(pencil())
    await user.clear(input())
    await user.type(input(), "Thrown away{Escape}")
    expect(onCommit).not.toHaveBeenCalled()
    expect(screen.getByText("Technical rider")).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).toBeNull()
    expect(pencil()).toHaveFocus()
  })

  it("an empty commit calls onCommit(\"\") and shows the default, muted", async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    render(<Harness onCommit={onCommit} />)
    await user.click(pencil())
    await user.clear(input())
    await user.keyboard("{Enter}")
    expect(onCommit).toHaveBeenCalledWith("")
    const shown = screen.getByText("Rider")
    expect(shown).toHaveAttribute("data-default")
    expect(shown).toHaveClass(styles.textDefault)
  })

  it("mutation control: a set value is not shown as the default", () => {
    render(<Harness />)
    const shown = screen.getByText("Technical rider")
    expect(shown).not.toHaveAttribute("data-default")
    expect(shown).not.toHaveClass(styles.textDefault)
  })

  it("while showing the default, the input opens empty with the default as its placeholder", async () => {
    const user = userEvent.setup()
    render(<Harness initial="" />)
    await user.click(pencil())
    expect(input()).toHaveValue("")
    expect(input()).toHaveAttribute("placeholder", "Rider")
  })

  it("whitespace-only commits as empty; surrounding whitespace is trimmed", async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    render(<Harness onCommit={onCommit} />)
    await user.click(pencil())
    await user.clear(input())
    await user.type(input(), "   {Enter}")
    expect(onCommit).toHaveBeenLastCalledWith("")
    await user.click(pencil())
    await user.type(input(), "  Backline  {Enter}")
    expect(onCommit).toHaveBeenLastCalledWith("Backline")
  })

  it("an unchanged commit does not call onCommit", async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    render(<Harness onCommit={onCommit} />)
    await user.click(pencil())
    await user.keyboard("{Enter}")
    await user.click(pencil())
    await user.click(document.body)
    expect(onCommit).not.toHaveBeenCalled()
  })

  it("Enter during IME composition does not commit", () => {
    const onCommit = vi.fn()
    render(<Harness onCommit={onCommit} defaultEditing />)
    const field = input()
    fireEvent.keyDown(field, { key: "Enter", isComposing: true })
    expect(onCommit).not.toHaveBeenCalled()
    expect(input()).toBeInTheDocument()
  })

  it("defaultEditing opens in the editing state without taking focus", () => {
    render(<Harness defaultEditing />)
    expect(input()).toHaveValue("Technical rider")
    expect(input()).not.toHaveFocus()
  })

  it("renders as the element it is given, so typography inherits from it", () => {
    render(<Harness as="h2" className="page-title" />)
    const heading = screen.getByRole("heading", { level: 2 })
    expect(heading).toHaveClass("page-title")
    expect(heading).toHaveAttribute("data-slot", "inline-edit")
    expect(heading).toHaveTextContent("Technical rider")
  })

  it("editLabel overrides the pencil's name", () => {
    render(<Harness editLabel="Rename rider" />)
    expect(screen.getByRole("button", { name: "Rename rider" })).toBeInTheDocument()
  })

  it("passes axe at rest and while editing", async () => {
    const { container, unmount } = render(<Harness />)
    await checkA11y(container)
    unmount()
    const editing = render(<Harness defaultEditing />)
    await checkA11y(editing.container)
  })
})
