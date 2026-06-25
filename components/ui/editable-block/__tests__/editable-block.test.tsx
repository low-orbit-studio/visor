import * as React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EditableBlock } from "../editable-block"

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function renderBlock(props?: Partial<React.ComponentProps<typeof EditableBlock>>) {
  return render(
    <EditableBlock
      label="Essence"
      value="coherent · open · yours"
      {...props}
    />
  )
}

/* ─── View state ──────────────────────────────────────────────────────── */

describe("EditableBlock — view state", () => {
  it("renders the label and value", () => {
    renderBlock()
    expect(screen.getByText("Essence")).toBeInTheDocument()
    expect(screen.getByText("coherent · open · yours")).toBeInTheDocument()
  })

  it("does not show the edit input by default", () => {
    renderBlock()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("does not show the done check when done=false", () => {
    renderBlock({ done: false })
    expect(screen.queryByLabelText("Done")).not.toBeInTheDocument()
  })

  it("shows the done check when done=true", () => {
    renderBlock({ done: true })
    expect(screen.getByLabelText("Done")).toBeInTheDocument()
  })

  it("does not show the AI action button in view state", () => {
    renderBlock()
    expect(screen.queryByRole("button", { name: /ask ai/i })).not.toBeInTheDocument()
  })
})

/* ─── View → Edit transition ──────────────────────────────────────────── */

describe("EditableBlock — view → edit transition", () => {
  it("enters editing state when the edit icon button is clicked", async () => {
    const user = userEvent.setup()
    renderBlock()
    await user.click(screen.getByRole("button", { name: "Edit Essence" }))
    expect(screen.getByRole("textbox")).toBeInTheDocument()
  })

  it("sets data-state=editing when editing", async () => {
    const user = userEvent.setup()
    renderBlock()
    await user.click(screen.getByRole("button", { name: "Edit Essence" }))
    const root = screen.getByRole("textbox").closest("[data-slot='editable-block']")
    expect(root).toHaveAttribute("data-state", "editing")
  })

  it("populates the input with the current value when editing opens", async () => {
    const user = userEvent.setup()
    renderBlock()
    await user.click(screen.getByRole("button", { name: "Edit Essence" }))
    expect(screen.getByRole("textbox")).toHaveValue("coherent · open · yours")
  })

  it("hides the value body during editing", async () => {
    const user = userEvent.setup()
    renderBlock()
    await user.click(screen.getByRole("button", { name: "Edit Essence" }))
    expect(screen.queryByText("coherent · open · yours")).not.toBeInTheDocument()
  })

  it("opens editing state immediately when defaultEditing=true", () => {
    renderBlock({ defaultEditing: true })
    expect(screen.getByRole("textbox")).toBeInTheDocument()
  })
})

/* ─── Save ────────────────────────────────────────────────────────────── */

describe("EditableBlock — save", () => {
  it("calls onSave with the edited value when Save is clicked", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    renderBlock({ onSave })
    await user.click(screen.getByRole("button", { name: "Edit Essence" }))
    const input = screen.getByRole("textbox")
    await user.clear(input)
    await user.type(input, "refined · sharp")
    await user.click(screen.getByRole("button", { name: "Save" }))
    expect(onSave).toHaveBeenCalledWith("refined · sharp")
  })

  it("calls onSave when Enter is pressed in the input", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    renderBlock({ onSave })
    await user.click(screen.getByRole("button", { name: "Edit Essence" }))
    await user.keyboard("{Enter}")
    expect(onSave).toHaveBeenCalled()
  })

  it("returns to view state after saving", async () => {
    const user = userEvent.setup()
    renderBlock({ onSave: vi.fn() })
    await user.click(screen.getByRole("button", { name: "Edit Essence" }))
    await user.click(screen.getByRole("button", { name: "Save" }))
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("cancels editing on Escape without calling onSave", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    renderBlock({ onSave })
    await user.click(screen.getByRole("button", { name: "Edit Essence" }))
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })
})

/* ─── AI action slot ─────────────────────────────────────────────────── */

describe("EditableBlock — AI action slot", () => {
  it("renders the AI action button in editing state", async () => {
    const user = userEvent.setup()
    renderBlock()
    await user.click(screen.getByRole("button", { name: "Edit Essence" }))
    expect(
      screen.getByRole("button", { name: "Ask AI to pressure-test" })
    ).toBeInTheDocument()
  })

  it("calls onAiAction when the AI action button is clicked", async () => {
    const user = userEvent.setup()
    const onAiAction = vi.fn()
    renderBlock({ onAiAction })
    await user.click(screen.getByRole("button", { name: "Edit Essence" }))
    await user.click(screen.getByRole("button", { name: "Ask AI to pressure-test" }))
    expect(onAiAction).toHaveBeenCalledTimes(1)
  })

  it("renders a custom AI action label", async () => {
    const user = userEvent.setup()
    renderBlock({ aiActionLabel: "Generate alternatives" })
    await user.click(screen.getByRole("button", { name: "Edit Essence" }))
    expect(
      screen.getByRole("button", { name: "Generate alternatives" })
    ).toBeInTheDocument()
  })

  it("suppresses the AI action button when aiActionLabel=null", async () => {
    const user = userEvent.setup()
    renderBlock({ aiActionLabel: null })
    await user.click(screen.getByRole("button", { name: "Edit Essence" }))
    expect(
      screen.queryByRole("button", { name: /ask ai/i })
    ).not.toBeInTheDocument()
  })
})

/* ─── data-state variants ────────────────────────────────────────────── */

describe("EditableBlock — data-state", () => {
  it("has data-state=default in view state (done=false)", () => {
    const { container } = renderBlock({ done: false })
    expect(container.querySelector("[data-slot='editable-block']")).toHaveAttribute(
      "data-state",
      "default"
    )
  })

  it("has data-state=done when done=true", () => {
    const { container } = renderBlock({ done: true })
    expect(container.querySelector("[data-slot='editable-block']")).toHaveAttribute(
      "data-state",
      "done"
    )
  })
})

/* ─── Keyboard accessibility ─────────────────────────────────────────── */

describe("EditableBlock — keyboard accessibility", () => {
  it("edit icon is focusable", () => {
    renderBlock()
    const editBtn = screen.getByRole("button", { name: "Edit Essence" })
    editBtn.focus()
    expect(editBtn).toHaveFocus()
  })

  it("save button has an accessible label", async () => {
    const user = userEvent.setup()
    renderBlock()
    await user.click(screen.getByRole("button", { name: "Edit Essence" }))
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
  })
})
