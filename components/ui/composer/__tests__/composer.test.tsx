import * as React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Paperclip } from "@phosphor-icons/react"
import {
  Composer,
  ComposerField,
  ComposerToolbar,
  ComposerToolButton,
  ComposerSpacer,
  ComposerSend,
} from "../composer"

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function renderComposer(props?: React.ComponentProps<typeof Composer>) {
  return render(
    <Composer {...props}>
      <ComposerField placeholder="Type a message…" />
      <ComposerToolbar>
        <ComposerToolButton icon={<Paperclip size={16} />} aria-label="Attach file" />
        <ComposerSpacer />
        <ComposerSend />
      </ComposerToolbar>
    </Composer>
  )
}

/* ─── Field: accepts text ─────────────────────────────────────────────── */

describe("ComposerField", () => {
  it("renders a textarea with the given placeholder", () => {
    renderComposer()
    const textarea = screen.getByRole("textbox")
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveAttribute("placeholder", "Type a message…")
  })

  it("accepts text input in uncontrolled mode", async () => {
    const user = userEvent.setup()
    renderComposer()
    const textarea = screen.getByRole("textbox")
    await user.type(textarea, "hello world")
    expect(textarea).toHaveValue("hello world")
  })

  it("reflects controlled value", () => {
    render(
      <Composer value="controlled text">
        <ComposerField />
      </Composer>
    )
    expect(screen.getByRole("textbox")).toHaveValue("controlled text")
  })

  it("calls onValueChange when typing (controlled mode)", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <Composer value="" onValueChange={onValueChange}>
        <ComposerField />
      </Composer>
    )
    await user.type(screen.getByRole("textbox"), "a")
    expect(onValueChange).toHaveBeenCalledWith("a")
  })
})

/* ─── Field: Enter submits, Shift+Enter does not ─────────────────────── */

describe("ComposerField keyboard submit", () => {
  it("calls onSubmit on Enter", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderComposer({ onSubmit })
    const textarea = screen.getByRole("textbox")
    await user.type(textarea, "hello")
    await user.keyboard("{Enter}")
    expect(onSubmit).toHaveBeenCalledWith("hello")
  })

  it("does NOT submit on Shift+Enter", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderComposer({ onSubmit })
    const textarea = screen.getByRole("textbox")
    await user.type(textarea, "hello")
    await user.keyboard("{Shift>}{Enter}{/Shift}")
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("does not submit when field is empty", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderComposer({ onSubmit })
    await user.keyboard("{Enter}")
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("clears the field after submit in uncontrolled mode", async () => {
    const user = userEvent.setup()
    renderComposer({ onSubmit: vi.fn() })
    const textarea = screen.getByRole("textbox")
    await user.type(textarea, "hello")
    await user.keyboard("{Enter}")
    expect(textarea).toHaveValue("")
  })
})

/* ─── Tool button aria-label ──────────────────────────────────────────── */

describe("ComposerToolButton", () => {
  it("renders with the given aria-label", () => {
    renderComposer()
    expect(screen.getByRole("button", { name: "Attach file" })).toBeInTheDocument()
  })

  it("is type=button to avoid form submission", () => {
    renderComposer()
    expect(screen.getByRole("button", { name: "Attach file" })).toHaveAttribute(
      "type",
      "button"
    )
  })

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Composer>
        <ComposerToolbar>
          <ComposerToolButton icon={<Paperclip size={16} />} aria-label="Attach" onClick={onClick} />
        </ComposerToolbar>
      </Composer>
    )
    await user.click(screen.getByRole("button", { name: "Attach" }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

/* ─── Send button: disabled state ─────────────────────────────────────── */

describe("ComposerSend", () => {
  it("is disabled when field is empty (uncontrolled)", () => {
    renderComposer()
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled()
  })

  it("is enabled when field has content", async () => {
    const user = userEvent.setup()
    renderComposer()
    await user.type(screen.getByRole("textbox"), "hi")
    expect(screen.getByRole("button", { name: "Send" })).not.toBeDisabled()
  })

  it("can be explicitly disabled via prop", () => {
    render(
      <Composer value="some text">
        <ComposerToolbar>
          <ComposerSend disabled />
        </ComposerToolbar>
      </Composer>
    )
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled()
  })

  it("calls onSubmit when clicked", async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderComposer({ onSubmit })
    await user.type(screen.getByRole("textbox"), "hello")
    await user.click(screen.getByRole("button", { name: "Send" }))
    expect(onSubmit).toHaveBeenCalledWith("hello")
  })

  it("uses the default aria-label 'Send'", () => {
    renderComposer()
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument()
  })

  it("accepts a custom aria-label", () => {
    render(
      <Composer value="hi">
        <ComposerToolbar>
          <ComposerSend aria-label="Submit message" />
        </ComposerToolbar>
      </Composer>
    )
    expect(screen.getByRole("button", { name: "Submit message" })).toBeInTheDocument()
  })
})

/* ─── Controlled / uncontrolled parity ────────────────────────────────── */

describe("Controlled mode", () => {
  it("onValueChange receives updated value on every keystroke", async () => {
    const user = userEvent.setup()
    const calls: string[] = []
    const onValueChange = (v: string) => calls.push(v)
    render(
      <Composer value={calls[calls.length - 1] ?? ""} onValueChange={onValueChange}>
        <ComposerField />
      </Composer>
    )
    // Just verify the callback fires — full re-render control is consumer's job
    await user.type(screen.getByRole("textbox"), "x")
    expect(calls.length).toBeGreaterThan(0)
  })
})

/* ─── Disabled propagation ─────────────────────────────────────────────── */

describe("Disabled state", () => {
  it("disables the textarea when Composer is disabled", () => {
    renderComposer({ disabled: true })
    expect(screen.getByRole("textbox")).toBeDisabled()
  })

  it("disables the send button when Composer is disabled", () => {
    render(
      <Composer disabled value="text">
        <ComposerToolbar>
          <ComposerSend />
        </ComposerToolbar>
      </Composer>
    )
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled()
  })

  it("disables tool buttons when Composer is disabled", () => {
    render(
      <Composer disabled>
        <ComposerToolbar>
          <ComposerToolButton icon={<Paperclip size={16} />} aria-label="Attach" />
        </ComposerToolbar>
      </Composer>
    )
    expect(screen.getByRole("button", { name: "Attach" })).toBeDisabled()
  })
})
