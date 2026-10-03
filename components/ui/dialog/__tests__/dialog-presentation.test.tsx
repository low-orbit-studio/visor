import * as React from "react"
import { render, screen, within, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  Dialog,
  DialogBack,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog"
import { checkA11y } from "../../../../test-utils/a11y"

type Listener = (e: { matches: boolean }) => void

/** Install a matchMedia whose min-width queries answer for `width`, and can be resized. */
function mockViewport(width: number) {
  const listeners = new Set<{ query: string; fn: Listener }>()
  const matches = (query: string) => {
    const m = /min-width:\s*([\d.]+)px/.exec(query)
    return m ? width >= Number(m[1]) : false
  }
  window.matchMedia = ((query: string) => ({
    matches: matches(query),
    media: query,
    addEventListener: (_: string, fn: Listener) => listeners.add({ query, fn }),
    removeEventListener: (_: string, fn: Listener) => {
      for (const l of listeners) if (l.fn === fn) listeners.delete(l)
    },
  })) as unknown as typeof window.matchMedia
  return (next: number) => {
    width = next
    act(() => listeners.forEach((l) => l.fn({ matches: matches(l.query) })))
  }
}

const original = window.matchMedia
afterEach(() => {
  window.matchMedia = original
})

function Body({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Add a booking</DialogTitle>
        <DialogDescription>Pick a date and time.</DialogDescription>
      </DialogHeader>
      <input aria-label="Start" />
      <DialogFooter>
        <button type="button">Save</button>
      </DialogFooter>
      {children}
    </>
  )
}

describe("Dialog presentation", () => {
  it("defaults to a centred dialog", () => {
    render(
      <Dialog open>
        <DialogContent><Body /></DialogContent>
      </Dialog>
    )
    expect(screen.getByRole("dialog")).toHaveAttribute("data-presentation", "dialog")
  })

  it("presentation=sheet renders the bottom sheet", () => {
    render(
      <Dialog open presentation="sheet">
        <DialogContent><Body /></DialogContent>
      </Dialog>
    )
    expect(screen.getByRole("dialog")).toHaveAttribute("data-presentation", "sheet")
  })

  it("presentation=responsive is a dialog above the breakpoint and a sheet below it", () => {
    const resize = mockViewport(1024)
    render(
      <Dialog open presentation="responsive" breakpoint={640}>
        <DialogContent><Body /></DialogContent>
      </Dialog>
    )
    expect(screen.getByRole("dialog")).toHaveAttribute("data-presentation", "dialog")
    resize(390)
    expect(screen.getByRole("dialog")).toHaveAttribute("data-presentation", "sheet")
    resize(800)
    expect(screen.getByRole("dialog")).toHaveAttribute("data-presentation", "dialog")
  })

  it("keeps the same content across the switch", () => {
    const resize = mockViewport(1024)
    render(
      <Dialog open presentation="responsive">
        <DialogContent><Body /></DialogContent>
      </Dialog>
    )
    resize(390)
    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByText("Add a booking")).toBeInTheDocument()
    expect(within(dialog).getByLabelText("Start")).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Save" })).toBeInTheDocument()
  })

  it("renders the drag handle only on the sheet, when asked", () => {
    const { rerender } = render(
      <Dialog open presentation="sheet">
        <DialogContent showHandle><Body /></DialogContent>
      </Dialog>
    )
    expect(document.querySelector('[data-slot="dialog-handle"]')).not.toBeNull()
    rerender(
      <Dialog open presentation="dialog">
        <DialogContent showHandle><Body /></DialogContent>
      </Dialog>
    )
    expect(document.querySelector('[data-slot="dialog-handle"]')).toBeNull()
  })

  for (const presentation of ["dialog", "sheet"] as const) {
    describe(`presentation=${presentation}`, () => {
      it("always shows a close button that dismisses", async () => {
        const onOpenChange = vi.fn()
        render(
          <Dialog open presentation={presentation} onOpenChange={onOpenChange}>
            <DialogContent><Body /></DialogContent>
          </Dialog>
        )
        await userEvent.click(screen.getByRole("button", { name: "Close" }))
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })

      it("closes on Escape", async () => {
        const onOpenChange = vi.fn()
        render(
          <Dialog open presentation={presentation} onOpenChange={onOpenChange}>
            <DialogContent><Body /></DialogContent>
          </Dialog>
        )
        await userEvent.keyboard("{Escape}")
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })

      it("traps Tab focus inside the content", async () => {
        render(
          <>
            <button type="button">Outside</button>
            <Dialog open presentation={presentation}>
              <DialogContent><Body /></DialogContent>
            </Dialog>
          </>
        )
        const dialog = screen.getByRole("dialog")
        for (let i = 0; i < 8; i++) {
          await userEvent.tab()
          expect(dialog.contains(document.activeElement)).toBe(true)
        }
        for (let i = 0; i < 8; i++) {
          await userEvent.tab({ shift: true })
          expect(dialog.contains(document.activeElement)).toBe(true)
        }
      })

      it("has no WCAG 2.1 AA violations", async () => {
        render(
          <Dialog open presentation={presentation}>
            <DialogContent showHandle>
              <Body />
            </DialogContent>
          </Dialog>
        )
        await checkA11y(screen.getByRole("dialog"))
      })
    })
  }

  it("opens uncontrolled and closes again", async () => {
    render(
      <Dialog defaultOpen presentation="sheet">
        <DialogContent><Body /></DialogContent>
      </Dialog>
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).toBeNull()
  })
})

describe("Dialog header back action", () => {
  it("renders a leading back action beside close", async () => {
    const onBack = vi.fn()
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader back={<DialogBack onClick={onBack} />}>
            <DialogTitle>Edit booking</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    const back = screen.getByRole("button", { name: "Back" })
    const close = screen.getByRole("button", { name: "Close" })
    // Back leads the title; close trails the content.
    expect(back.compareDocumentPosition(screen.getByText("Edit booking")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(back.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await userEvent.click(back)
    expect(onBack).toHaveBeenCalledOnce()
    // Back does not dismiss.
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("has no WCAG 2.1 AA violations with the back action", async () => {
    render(
      <Dialog open presentation="sheet">
        <DialogContent>
          <DialogHeader back={<DialogBack />}>
            <DialogTitle>Edit booking</DialogTitle>
            <DialogDescription>Change the details.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    await checkA11y(screen.getByRole("dialog"))
  })
})

describe("Dialog container (scoped)", () => {
  function Scoped({ presentation, onOpenChange, onOutside }: {
    presentation?: "dialog" | "sheet"
    onOpenChange?: (o: boolean) => void
    onOutside?: () => void
  }) {
    const [pane, setPane] = React.useState<HTMLElement | null>(null)
    return (
      <div>
        <button type="button" onClick={onOutside}>Top bar</button>
        <section ref={setPane} data-testid="pane">
          <button type="button">Editor field</button>
        </section>
        <Dialog open presentation={presentation} container={pane} onOpenChange={onOpenChange}>
          <DialogContent><Body /></DialogContent>
        </Dialog>
      </div>
    )
  }

  for (const presentation of ["dialog", "sheet"] as const) {
    describe(`presentation=${presentation}`, () => {
      it("portals into the container and covers only it", async () => {
        render(<Scoped presentation={presentation} />)
        const pane = screen.getByTestId("pane")
        expect(await within(pane).findByRole("dialog")).toBeInTheDocument()
        expect(pane.querySelector('[data-slot="dialog-overlay"]')).not.toBeNull()
        expect(document.body.querySelector(':scope > [data-slot="dialog-overlay"]')).toBeNull()
      })

      it("leaves content outside the container interactive", async () => {
        const onOutside = vi.fn()
        const onOpenChange = vi.fn()
        render(<Scoped presentation={presentation} onOutside={onOutside} onOpenChange={onOpenChange} />)
        await screen.findByRole("dialog")
        const bar = screen.getByRole("button", { name: "Top bar" })

        // Not the modal-mode side effects: no aria-hiding, no inert, no dead body.
        expect(bar.closest("[aria-hidden]")).toBeNull()
        expect(bar.closest("[inert]")).toBeNull()
        expect(document.body.style.pointerEvents).not.toBe("none")

        await userEvent.click(bar)
        expect(onOutside).toHaveBeenCalledOnce()
        // Pressing the page outside the container does not dismiss.
        expect(onOpenChange).not.toHaveBeenCalled()
      })

      it("makes only the container's other children inert", async () => {
        render(<Scoped presentation={presentation} />)
        await screen.findByRole("dialog")
        const editor = screen.getByRole("button", { name: "Editor field" })
        expect(editor.closest("[inert]")).not.toBeNull()
        expect(screen.getByRole("button", { name: "Top bar" }).closest("[inert]")).toBeNull()
      })

      it("traps Tab focus inside the content and closes on Escape", async () => {
        const onOpenChange = vi.fn()
        render(<Scoped presentation={presentation} onOpenChange={onOpenChange} />)
        const dialog = await screen.findByRole("dialog")
        for (let i = 0; i < 8; i++) {
          await userEvent.tab()
          expect(dialog.contains(document.activeElement)).toBe(true)
        }
        await userEvent.keyboard("{Escape}")
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })

      it("dismisses from the scrim only", async () => {
        const onOpenChange = vi.fn()
        render(<Scoped presentation={presentation} onOpenChange={onOpenChange} />)
        await screen.findByRole("dialog")
        const scrim = screen.getByTestId("pane").querySelector('[data-slot="dialog-overlay"]') as HTMLElement
        await userEvent.click(scrim)
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })

      it("has no WCAG 2.1 AA violations", async () => {
        render(<Scoped presentation={presentation} />)
        await screen.findByRole("dialog")
        await checkA11y(screen.getByTestId("pane"))
      })
    })
  }

  it("removes inert from siblings when the dialog closes", async () => {
    function Toggle() {
      const [pane, setPane] = React.useState<HTMLElement | null>(null)
      const [open, setOpen] = React.useState(true)
      return (
        <>
          <section ref={setPane} data-testid="pane"><button type="button">Editor field</button></section>
          <Dialog open={open} onOpenChange={setOpen} container={pane}>
            <DialogContent><Body /></DialogContent>
          </Dialog>
        </>
      )
    }
    render(<Toggle />)
    await screen.findByRole("dialog")
    expect(screen.getByRole("button", { name: "Editor field" }).closest("[inert]")).not.toBeNull()
    await userEvent.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(screen.getByRole("button", { name: "Editor field" }).closest("[inert]")).toBeNull()
  })
})
