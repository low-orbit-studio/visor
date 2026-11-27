import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { axe } from "../../../../test-utils/axe"
import { DecisionDock } from "../decision-dock"

const key = (k: string, init: KeyboardEventInit = {}) => fireEvent.keyDown(window, { key: k, ...init })

describe("DecisionDock", () => {
  it("is a region carrying the label, the question and two buttons, each with its key", () => {
    render(<DecisionDock label="VI-865" question="Does the dock look right?" />)
    const region = screen.getByRole("region", { name: "Your answer" })
    expect(region.textContent).toContain("VI-865")
    expect(region.textContent).toContain("Does the dock look right?")
    const needs = screen.getByRole("button", { name: /Needs Work/ })
    const approve = screen.getByRole("button", { name: /Approve/ })
    expect(needs.querySelector("kbd")!.textContent).toBe("N")
    expect(approve.querySelector("kbd")!.textContent).toBe("A")
  })

  it("approve: the button and the A key both send Approved", () => {
    const onAnswer = vi.fn()
    const { unmount } = render(<DecisionDock question="Q" onAnswer={onAnswer} />)
    fireEvent.click(screen.getByRole("button", { name: /Approve/ }))
    expect(onAnswer).toHaveBeenCalledWith("Approved", undefined)
    unmount()
    const viaKey = vi.fn()
    render(<DecisionDock question="Q" onAnswer={viaKey} />)
    key("a")
    expect(viaKey).toHaveBeenCalledWith("Approved", undefined)
  })

  it("pick: Send is disabled with no key until a choice, then sends it on click or Enter", () => {
    const onAnswer = vi.fn()
    const { rerender } = render(<DecisionDock kind="pick" question="Q" choice={null} onAnswer={onAnswer} />)
    const waiting = screen.getByRole("button", { name: "Choose an Option" })
    expect(waiting).toBeDisabled()
    expect(waiting.querySelector("kbd")).toBeNull()
    key("Enter")
    expect(onAnswer).not.toHaveBeenCalled()

    rerender(<DecisionDock kind="pick" question="Q" choice="B" onAnswer={onAnswer} />)
    const send = screen.getByRole("button", { name: /Send B/ })
    expect(send).toBeEnabled()
    expect(send.querySelector("kbd")!.textContent).toBe("↵")
    key("Enter")
    expect(onAnswer).toHaveBeenCalledWith("Sent B", undefined)
  })

  it("run: I Ran It sends on click and on R", () => {
    const onAnswer = vi.fn()
    render(<DecisionDock kind="run" question="Q" onAnswer={onAnswer} />)
    expect(screen.getByRole("button", { name: /I Ran It/ }).querySelector("kbd")!.textContent).toBe("R")
    key("r")
    expect(onAnswer).toHaveBeenCalledWith("Ran it", undefined)
  })

  it("leaves keys with a modifier alone", () => {
    const onAnswer = vi.fn()
    render(<DecisionDock question="Q" onAnswer={onAnswer} />)
    key("a", { metaKey: true })
    key("n", { ctrlKey: true })
    expect(onAnswer).not.toHaveBeenCalled()
    expect(screen.queryByRole("textbox")).toBeNull()
  })

  it("Needs Work (or N) opens a focused note in place; Escape closes it", () => {
    render(<DecisionDock question="Q" />)
    key("n")
    const field = screen.getByRole("textbox", { name: "What needs work?" })
    expect(document.activeElement).toBe(field)
    // Typing N in the note is text, not the shortcut.
    fireEvent.keyDown(field, { key: "n" })
    expect(screen.getByRole("textbox")).toBe(field)
    fireEvent.keyDown(field, { key: "Escape" })
    expect(screen.queryByRole("textbox")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: /Needs Work/ }))
    expect(screen.getByRole("textbox")).toBeTruthy()
  })

  it("the note sends with ⌘↵ as Needs work with its text", () => {
    const onAnswer = vi.fn()
    render(<DecisionDock question="Q" onAnswer={onAnswer} />)
    key("n")
    const field = screen.getByRole("textbox")
    fireEvent.change(field, { target: { value: "  The gap is too tight  " } })
    fireEvent.keyDown(field, { key: "Enter", metaKey: true })
    expect(onAnswer).toHaveBeenCalledWith("Needs work", "The gap is too tight")
  })

  it("an empty note does not send", () => {
    const onAnswer = vi.fn()
    render(<DecisionDock question="Q" onAnswer={onAnswer} />)
    key("n")
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", metaKey: true })
    expect(onAnswer).not.toHaveBeenCalled()
  })

  it("sent state: a drawn check, the verdict line and a progress bar that calls onAdvance", () => {
    const onAdvance = vi.fn()
    const { container } = render(<DecisionDock question="Q" sentText="On to the next one." onAdvance={onAdvance} />)
    key("a")
    const status = screen.getByRole("status")
    expect(status.textContent).toBe("Approved. On to the next one.")
    expect(status.querySelector("svg path")).toBeTruthy()
    expect(screen.queryByRole("button")).toBeNull()
    // Answered once: the keys no longer send.
    key("a")
    // jsdom has no AnimationEvent, so React listens for the webkit name there.
    fireEvent(container.querySelector('[data-slot="decision-dock-progress"]')!, new Event("webkitAnimationEnd", { bubbles: true }))
    expect(onAdvance).toHaveBeenCalledTimes(1)
  })

  it("has no axe violations in each phase", async () => {
    const { container } = render(<DecisionDock label="VI-865" question="Does it look right?" />)
    expect(await axe(container)).toHaveNoViolations()
    key("n")
    expect(await axe(container)).toHaveNoViolations()
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "x" } })
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter", metaKey: true })
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe("DecisionDock CSS", () => {
  const css = readFileSync(resolve(process.cwd(), "components/ui/decision-dock/decision-dock.module.css"), "utf8")

  it("is sticky to the bottom of the viewport and reads the glass layer", () => {
    expect(css).toMatch(/\.root \{[^}]*position: sticky;[^}]*bottom:/)
    expect(css).toContain("var(--glass-on-fill,")
    expect(css).toContain("var(--glass-on-blur,")
  })

  it("draws every colour from a theme token (no bare hex or rgb outside var() fallbacks)", () => {
    const src = css.replace(/\/\*[\s\S]*?\*\//g, "")
    // Walk the parens: a literal colour is allowed only inside a var() (as its fallback).
    const stack: boolean[] = []
    for (let i = 0; i < src.length; i++) {
      if (src[i] === "(") stack.push(src.slice(i - 3, i) === "var")
      else if (src[i] === ")") stack.pop()
      else if (/^(#[0-9a-f]{3,8}\b|rgb\()/i.test(src.slice(i, i + 9))) {
        expect(stack.includes(true), src.slice(i - 40, i + 10)).toBe(true)
      }
    }
  })
})
