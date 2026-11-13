import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
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

describe("InlineEdit pencil={false} (VI-677)", () => {
  const text = () => screen.getByRole("button", { name: "Edit Rider title, Technical rider" })

  it("draws no pencil; the text is a button named Edit {label} plus the value", () => {
    render(<Harness pencil={false} />)
    expect(document.querySelector('[data-slot="inline-edit-pencil"]')).toBeNull()
    expect(screen.getAllByRole("button", { name: /^Edit/ })).toHaveLength(1)
    expect(text()).toHaveTextContent("Technical rider")
    expect(text().tagName).toBe("BUTTON")
  })

  it("names the muted default too", () => {
    render(<Harness pencil={false} initial="" />)
    expect(screen.getByRole("button", { name: "Edit Rider title, Rider" })).toHaveAttribute("data-default")
  })

  it("opens the field on click", async () => {
    const user = userEvent.setup()
    render(<Harness pencil={false} />)
    await user.click(text())
    expect(input()).toHaveValue("Technical rider")
    expect(input()).toHaveFocus()
  })

  it("opens the field on Enter and on Space", async () => {
    const user = userEvent.setup()
    render(<Harness pencil={false} />)
    text().focus()
    await user.keyboard("{Enter}")
    expect(input()).toHaveFocus()
    await user.keyboard("{Escape}")
    text().focus()
    await user.keyboard(" ")
    expect(input()).toHaveFocus()
  })

  it("is reachable by Tab", async () => {
    const user = userEvent.setup()
    render(<Harness pencil={false} />)
    await user.tab()
    expect(text()).toHaveFocus()
  })

  it("Enter commits and focus returns to the text", async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    render(<Harness pencil={false} onCommit={onCommit} />)
    await user.click(text())
    await user.clear(input())
    await user.type(input(), "Hospitality rider{Enter}")
    expect(onCommit).toHaveBeenCalledWith("Hospitality rider")
    expect(screen.getByRole("button", { name: "Edit Rider title, Hospitality rider" })).toHaveFocus()
  })

  it("Escape restores without committing and focus returns to the text", async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()
    render(<Harness pencil={false} onCommit={onCommit} />)
    await user.click(text())
    await user.type(input(), "x{Escape}")
    expect(onCommit).not.toHaveBeenCalled()
    expect(text()).toHaveFocus()
  })

  it("editLabel overrides the lead of the name", () => {
    render(<Harness pencil={false} editLabel="Rename rider" />)
    expect(screen.getByRole("button", { name: "Rename rider, Technical rider" })).toBeInTheDocument()
  })

  it("passes axe at rest, as a heading, and while editing", async () => {
    const rest = render(<Harness pencil={false} />)
    await checkA11y(rest.container)
    rest.unmount()
    const heading = render(<Harness pencil={false} as="h2" />)
    await checkA11y(heading.container)
    heading.unmount()
    const editing = render(<Harness pencil={false} defaultEditing />)
    await checkA11y(editing.container)
  })
})

describe("InlineEdit async saves (VI-760)", () => {
  /** A save the test settles by hand. */
  function deferred() {
    let resolve!: (value: unknown) => void
    let reject!: (reason: unknown) => void
    const promise = new Promise((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }

  function AsyncHarness({ save }: { save: (next: string) => Promise<unknown> }) {
    const [value, setValue] = React.useState("Technical rider")
    return (
      <InlineEdit
        label="Rider title"
        value={value}
        onCommit={async (next) => {
          const result = await save(next)
          if (!(result && typeof result === "object" && "error" in result)) setValue(next)
          return result
        }}
      />
    )
  }

  const root = () => document.querySelector('[data-slot="inline-edit"]')!

  it("is busy and read-only while the save runs, then rests with focus back on the pencil", async () => {
    const user = userEvent.setup()
    const save = deferred()
    render(<AsyncHarness save={() => save.promise} />)
    await user.click(pencil())
    await user.type(input(), " v2{Enter}")
    expect(root()).toHaveAttribute("aria-busy", "true")
    expect(input()).toHaveAttribute("readonly")
    expect(input()).toHaveValue("Technical rider v2")
    await act(async () => save.resolve(undefined))
    expect(root()).not.toHaveAttribute("aria-busy")
    expect(screen.queryByRole("textbox")).toBeNull()
    expect(screen.getByText("Technical rider v2")).toBeInTheDocument()
    expect(pencil()).toHaveFocus()
  })

  it("a rejected save shows the message under the field, keeps the typed text, and Enter retries", async () => {
    const user = userEvent.setup()
    const save = vi.fn().mockRejectedValueOnce(new Error("Network down")).mockResolvedValueOnce(undefined)
    render(<AsyncHarness save={save} />)
    await user.click(pencil())
    await user.clear(input())
    await user.type(input(), "Stage plot{Enter}")
    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Network down")
    expect(input()).toHaveValue("Stage plot")
    expect(input()).toHaveAttribute("aria-invalid", "true")
    expect(input()).toHaveAccessibleDescription("Network down")
    expect(root()).not.toHaveAttribute("aria-busy")
    await user.keyboard("{Enter}")
    expect(save).toHaveBeenCalledTimes(2)
    expect(save).toHaveBeenLastCalledWith("Stage plot")
    await screen.findByText("Stage plot")
    expect(screen.queryByRole("alert")).toBeNull()
    expect(screen.queryByRole("textbox")).toBeNull()
  })

  it("a save that resolves to { error } fails the same way", async () => {
    const user = userEvent.setup()
    render(<AsyncHarness save={async () => ({ error: "Name taken" })} />)
    await user.click(pencil())
    await user.type(input(), "!{Enter}")
    expect(await screen.findByRole("alert")).toHaveTextContent("Name taken")
    expect(input()).toHaveValue("Technical rider!")
  })

  it("a rejection with no message falls back to a generic one", async () => {
    const user = userEvent.setup()
    render(<AsyncHarness save={() => Promise.reject(undefined)} />)
    await user.click(pencil())
    await user.type(input(), "!{Enter}")
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save.")
  })

  it("Escape after a failure restores the value and clears the error", async () => {
    const user = userEvent.setup()
    render(<AsyncHarness save={() => Promise.reject(new Error("Nope"))} />)
    await user.click(pencil())
    await user.type(input(), "!{Enter}")
    await screen.findByRole("alert")
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("alert")).toBeNull()
    expect(screen.getByText("Technical rider")).toBeInTheDocument()
    expect(pencil()).toHaveFocus()
  })

  it("a save after blur does not pull focus back", async () => {
    const user = userEvent.setup()
    const save = deferred()
    render(
      <>
        <AsyncHarness save={() => save.promise} />
        <button type="button">Next field</button>
      </>
    )
    await user.click(pencil())
    await user.type(input(), "!")
    await user.tab()
    const next = screen.getByRole("button", { name: "Next field" })
    expect(next).toHaveFocus()
    await act(async () => save.resolve(undefined))
    expect(next).toHaveFocus()
  })

  it("passes axe while showing an error", async () => {
    const user = userEvent.setup()
    const { container } = render(<AsyncHarness save={() => Promise.reject(new Error("Nope"))} />)
    await user.click(pencil())
    await user.type(input(), "!{Enter}")
    await screen.findByRole("alert")
    await checkA11y(container)
  })
})

describe("InlineEdit default is unchanged (VI-677 back-compat)", () => {
  const html = (ui: React.ReactElement) => render(ui).container.innerHTML

  it("renders byte-identical markup to before the pencil prop existed", () => {
    expect(html(<InlineEdit label="Rider title" value="Technical rider" onCommit={() => {}} />)).toBe(
      "<span data-slot=\"inline-edit\" data-state=\"rest\" class=\"root\"><span data-slot=\"inline-edit-text\" class=\"text\">Technical rider</span><button type=\"button\" data-slot=\"inline-edit-pencil\" class=\"pencil\" aria-label=\"Edit Rider title\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" fill=\"currentColor\" viewBox=\"0 0 256 256\" aria-hidden=\"true\"><path d=\"M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z\"></path></svg></button></span>"
    )
    expect(html(<InlineEdit as="h2" label="T" value="" defaultValue="Rider" onCommit={() => {}} />)).toBe(
      "<h2 data-slot=\"inline-edit\" data-state=\"rest\" class=\"root\"><span data-slot=\"inline-edit-text\" data-default=\"true\" class=\"text textDefault\">Rider</span><button type=\"button\" data-slot=\"inline-edit-pencil\" class=\"pencil\" aria-label=\"Edit T\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" fill=\"currentColor\" viewBox=\"0 0 256 256\" aria-hidden=\"true\"><path d=\"M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z\"></path></svg></button></h2>"
    )
  })

  it("pencil={true} is the default", () => {
    const base = html(<InlineEdit label="L" value="v" onCommit={() => {}} />)
    document.body.innerHTML = ""
    expect(html(<InlineEdit label="L" value="v" pencil onCommit={() => {}} />)).toBe(base)
  })
})

