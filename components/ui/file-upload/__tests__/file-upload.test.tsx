import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { FileUpload } from "../file-upload"
import { checkA11y } from "../../../../test-utils/a11y"

function createFile(name: string, sizeMB: number, type = "text/plain"): File {
  const bytes = new Uint8Array(sizeMB * 1024 * 1024)
  return new File([bytes], name, { type })
}

function createDataTransfer(files: File[]): DataTransfer {
  return {
    files: files as unknown as FileList,
  } as DataTransfer
}

describe("FileUpload", () => {
  it("renders with data-slot and role='button'", () => {
    render(<FileUpload />)
    const el = screen.getByRole("button")
    expect(el).toHaveAttribute("data-slot", "file-upload")
  })

  it("renders default content (icon, text, hint)", () => {
    render(<FileUpload />)
    expect(screen.getByText("Drag and drop files here, or click to browse")).toBeInTheDocument()
    expect(screen.getByText(/All file types accepted/)).toBeInTheDocument()
  })

  it("renders custom children when provided", () => {
    render(<FileUpload><span>Custom content</span></FileUpload>)
    expect(screen.getByText("Custom content")).toBeInTheDocument()
    expect(screen.queryByText("Drag and drop files here, or click to browse")).not.toBeInTheDocument()
  })

  it("shows dragging state on dragOver, removes on dragLeave", () => {
    render(<FileUpload />)
    const el = screen.getByRole("button")

    fireEvent.dragOver(el)
    expect(el).toHaveAttribute("data-dragging", "true")

    fireEvent.dragLeave(el)
    expect(el).not.toHaveAttribute("data-dragging")
  })

  it("calls onFilesChange when files are dropped", () => {
    const handler = vi.fn()
    render(<FileUpload onFilesChange={handler} />)
    const el = screen.getByRole("button")
    const file = createFile("test.txt", 1)

    fireEvent.drop(el, { dataTransfer: createDataTransfer([file]) })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith([file])
  })

  it("calls onFilesChange when files selected via input change", () => {
    const handler = vi.fn()
    render(<FileUpload onFilesChange={handler} />)
    const input = document.querySelector("input[type='file']") as HTMLInputElement
    const file = createFile("doc.pdf", 1, "application/pdf")

    fireEvent.change(input, { target: { files: [file] } })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith([file])
  })

  it("disabled state: has data-disabled, aria-disabled, tabIndex=-1", () => {
    render(<FileUpload disabled />)
    const el = screen.getByRole("button", { hidden: true })
    expect(el).toHaveAttribute("data-disabled", "true")
    expect(el).toHaveAttribute("aria-disabled", "true")
    expect(el).toHaveAttribute("tabindex", "-1")
  })

  it("does not call onFilesChange when disabled and files are dropped", () => {
    const handler = vi.fn()
    render(<FileUpload disabled onFilesChange={handler} />)
    const el = screen.getByRole("button", { hidden: true })
    const file = createFile("test.txt", 1)

    fireEvent.drop(el, { dataTransfer: createDataTransfer([file]) })

    expect(handler).not.toHaveBeenCalled()
  })

  it("file size validation: files exceeding maxSize are excluded", () => {
    const handler = vi.fn()
    render(<FileUpload maxSize={5} onFilesChange={handler} />)
    const el = screen.getByRole("button")

    const small = createFile("small.txt", 2)
    const large = createFile("large.txt", 10)

    fireEvent.drop(el, { dataTransfer: createDataTransfer([small, large]) })

    expect(handler).toHaveBeenCalledWith([small])
  })

  it("file count validation: only up to maxFiles are passed", () => {
    const handler = vi.fn()
    render(<FileUpload maxFiles={2} onFilesChange={handler} />)
    const el = screen.getByRole("button")

    const f1 = createFile("a.txt", 1)
    const f2 = createFile("b.txt", 1)
    const f3 = createFile("c.txt", 1)

    fireEvent.drop(el, { dataTransfer: createDataTransfer([f1, f2, f3]) })

    expect(handler).toHaveBeenCalledTimes(1)
    const files = handler.mock.calls[0][0]
    expect(files).toHaveLength(2)
  })

  it("keyboard activation: Enter triggers file input", () => {
    render(<FileUpload />)
    const el = screen.getByRole("button")
    const input = document.querySelector("input[type='file']") as HTMLInputElement
    const clickSpy = vi.spyOn(input, "click")

    fireEvent.keyDown(el, { key: "Enter" })
    expect(clickSpy).toHaveBeenCalled()
  })

  it("keyboard activation: Space triggers file input", () => {
    render(<FileUpload />)
    const el = screen.getByRole("button")
    const input = document.querySelector("input[type='file']") as HTMLInputElement
    const clickSpy = vi.spyOn(input, "click")

    fireEvent.keyDown(el, { key: " " })
    expect(clickSpy).toHaveBeenCalled()
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<FileUpload ref={ref} />)
    expect(ref.current).not.toBeNull()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<FileUpload />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations when disabled", async () => {
    const { container } = render(<FileUpload disabled />)
    await checkA11y(container)
  })
})
