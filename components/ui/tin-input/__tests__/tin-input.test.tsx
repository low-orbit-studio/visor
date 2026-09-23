import { act, render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderToString } from "react-dom/server"
import { afterEach, beforeEach, describe, it, expect, vi, type MockInstance } from "vitest"
import { TinInput, type TinInputProps } from "../tin-input"
import { Field, FieldLabel } from "../../field/field"
import { PasswordManagersProvider } from "../../../../lib/password-managers-context"

const DIGITS = "987654321"

// jsdom reports no document focus while it dispatches a blur; a browser page
// keeps focus as focus moves within it. Model an active window, and lower it
// where a test switches apps.
let hasFocus: MockInstance<() => boolean>
beforeEach(() => {
  hasFocus = vi.spyOn(document, "hasFocus").mockReturnValue(true)
})
afterEach(() => hasFocus.mockRestore())

function renderTin(props: Partial<TinInputProps> = {}) {
  const onValueChange = vi.fn()
  const user = userEvent.setup()
  const utils = render(
    <Field>
      <FieldLabel htmlFor="tin">Taxpayer ID</FieldLabel>
      <TinInput id="tin" kind="ssn" onValueChange={onValueChange} {...props} />
    </Field>
  )
  const input = () => screen.getByLabelText("Taxpayer ID") as HTMLInputElement
  return { ...utils, user, onValueChange, input }
}

/** Every run of five consecutive typed digits — none may survive a commit. */
function fiveDigitWindows(digits: string): string[] {
  return Array.from({ length: digits.length - 4 }, (_, i) => digits.slice(i, i + 5))
}

describe("TinInput", () => {
  describe("onValueChange", () => {
    it("typing 9 digits calls onValueChange once with the digits", async () => {
      const { user, input, onValueChange } = renderTin()
      await user.type(input(), DIGITS)

      const withDigits = onValueChange.mock.calls.filter(([v]) => v !== null)
      expect(withDigits).toEqual([[DIGITS]])
      expect(onValueChange).toHaveBeenLastCalledWith(DIGITS)
    })

    it("fewer than 9 digits give null", async () => {
      const { user, input, onValueChange } = renderTin()
      await user.type(input(), "98765432")

      expect(onValueChange).toHaveBeenCalled()
      expect(onValueChange.mock.calls.every(([v]) => v === null)).toBe(true)
    })

    it("deleting a digit from a complete entry reports null", async () => {
      const { user, input, onValueChange } = renderTin()
      await user.type(input(), DIGITS)
      await user.keyboard("{Backspace}")

      expect(onValueChange).toHaveBeenLastCalledWith(null)
      await user.keyboard("1")
      expect(onValueChange).toHaveBeenLastCalledWith("987654321".slice(0, 8) + "1")
    })

    it("ignores non-digits and a tenth digit", async () => {
      const { user, input, onValueChange } = renderTin()
      await user.type(input(), "98a7-6 54x321")
      expect(onValueChange).toHaveBeenLastCalledWith(DIGITS)

      await user.type(input(), "0")
      expect(onValueChange).toHaveBeenLastCalledWith(DIGITS)
      expect(onValueChange.mock.calls.filter(([v]) => v !== null)).toHaveLength(1)
    })
  })

  describe("masking", () => {
    it("masks every character as it is typed", async () => {
      const { user, input, container } = renderTin()
      await user.type(input(), "9876")

      expect(input().value).toBe("•••-•")
      expect(container.innerHTML).not.toMatch(/9876|987|876/)
    })

    it("after blur holds no run of the typed digits beyond the last four, and the value is the mask", async () => {
      const { user, input, container } = renderTin()
      await user.type(input(), DIGITS)
      await user.tab()

      expect(input().value).toBe("•••-••-4321")
      const html = container.innerHTML
      for (const run of fiveDigitWindows(DIGITS)) {
        expect(html).not.toContain(run)
      }
      expect(html).not.toContain("98765")
      for (const el of container.querySelectorAll("*")) {
        for (const attr of el.getAttributeNames()) {
          expect(el.getAttribute(attr) ?? "").not.toMatch(/\d{5,}/)
        }
      }
    })

    it("refocusing a committed field clears it and reports null", async () => {
      const { user, input, onValueChange } = renderTin()
      await user.type(input(), DIGITS)
      await user.tab()
      onValueChange.mockClear()

      await user.click(input())
      expect(input().value).toBe("")
      expect(onValueChange).toHaveBeenCalledWith(null)
      expect(onValueChange).not.toHaveBeenCalledWith(DIGITS)
    })

    it("switching apps and back keeps a complete entry", async () => {
      const { user, input, onValueChange } = renderTin()
      await user.type(input(), DIGITS)
      onValueChange.mockClear()

      // The window deactivates: the field blurs with the whole document, and
      // coming back refocuses it.
      hasFocus.mockReturnValue(false)
      act(() => input().blur())
      hasFocus.mockReturnValue(true)
      act(() => input().focus())

      expect(input().value).toBe("•••-••-••••")
      expect(onValueChange).not.toHaveBeenCalled()

      // A blur within the page still commits.
      await user.tab()
      expect(input().value).toBe("•••-••-4321")
    })

    it("blurring an incomplete entry keeps it masked for the user to finish", async () => {
      const { user, input, onValueChange } = renderTin()
      await user.type(input(), "9876")
      await user.tab()
      expect(input().value).toBe("•••-•")

      await user.click(input())
      await user.type(input(), "54321")
      expect(onValueChange).toHaveBeenLastCalledWith(DIGITS)
    })

    it("backspace in the middle removes the digit before the caret", async () => {
      const { user, input, onValueChange } = renderTin()
      await user.type(input(), "98765")
      // "•••-••": a caret after the third bullet removes the third digit.
      input().setSelectionRange(3, 3)
      await user.keyboard("{Backspace}")
      expect(input().value).toBe("•••-•")
      await user.keyboard("{End}74321")
      expect(onValueChange).toHaveBeenLastCalledWith("986574321")
    })

    it("select-all then delete clears the entry", async () => {
      const { user, input, onValueChange } = renderTin()
      await user.type(input(), DIGITS)
      input().setSelectionRange(0, input().value.length)
      await user.keyboard("{Delete}")

      expect(input().value).toBe("")
      expect(onValueChange).toHaveBeenLastCalledWith(null)
    })

    it("forward delete removes the digit after the caret", async () => {
      const { user, input, onValueChange } = renderTin()
      await user.type(input(), "198765432")
      input().setSelectionRange(0, 0)
      await user.keyboard("{Delete}")
      expect(onValueChange).toHaveBeenLastCalledWith(null)

      await user.keyboard("{End}1")
      expect(onValueChange).toHaveBeenLastCalledWith("987654321")
    })

    it("word and line deletions take every digit on that side of the caret", async () => {
      const { user, input } = renderTin()
      await user.type(input(), DIGITS)
      // "•••-••-••••": offset 6 sits after the fifth bullet.
      input().setSelectionRange(6, 6)
      fireEvent(
        input(),
        new InputEvent("beforeinput", { inputType: "deleteWordBackward", bubbles: true, cancelable: true })
      )
      // Five digits gone, four left: "•••-•".
      expect(input().value).toBe("•••-•")
      input().setSelectionRange(0, 0)
      fireEvent(
        input(),
        new InputEvent("beforeinput", { inputType: "deleteSoftLineForward", bubbles: true, cancelable: true })
      )
      expect(input().value).toBe("")
    })

    it("refuses a drop that would overflow, like a paste", async () => {
      const { user, input } = renderTin()
      await user.click(input())
      fireEvent(
        input(),
        new InputEvent("beforeinput", {
          inputType: "insertFromDrop",
          data: "1234567890",
          bubbles: true,
          cancelable: true,
        })
      )
      expect(screen.getByRole("alert")).toHaveTextContent(/9 digits/)
      expect(input().value).toBe("")
    })

    it("recovers digits from input the beforeinput listener could not cancel", async () => {
      const { user, input, onValueChange } = renderTin()
      await user.type(input(), "987")
      // An IME composition commits straight into the DOM value.
      fireEvent.change(input(), { target: { value: "•••6" } })
      expect(input().value).toBe("•••-•")

      await user.type(input(), "54321", { skipClick: true })
      expect(onValueChange).toHaveBeenLastCalledWith(DIGITS)
    })
  })

  describe("paste", () => {
    it("normalizes 123-45-6789", async () => {
      const { user, input, onValueChange } = renderTin()
      await user.click(input())
      await user.paste("123-45-6789")

      expect(onValueChange).toHaveBeenLastCalledWith("123456789")
      expect(input().value).toBe("•••-••-••••")
    })

    it("strips spaces", async () => {
      const { user, input, onValueChange } = renderTin()
      await user.click(input())
      await user.paste(" 123 45 6789 ")
      expect(onValueChange).toHaveBeenLastCalledWith("123456789")
    })

    it("refuses 10 digits with an error rather than truncating", async () => {
      const { user, input, onValueChange } = renderTin()
      await user.click(input())
      await user.paste("1234567890")

      expect(input().value).toBe("")
      expect(onValueChange).not.toHaveBeenCalledWith("123456789")
      const alert = screen.getByRole("alert")
      expect(alert).toHaveTextContent(/9 digits/)
      expect(input()).toHaveAttribute("aria-invalid", "true")
      expect(input().getAttribute("aria-describedby")).toContain(alert.id)
    })

    it("clears the paste error on the next accepted edit", async () => {
      const { user, input } = renderTin()
      await user.click(input())
      await user.paste("1234567890")
      expect(screen.getByRole("alert")).toBeInTheDocument()

      await user.keyboard("1")
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
      expect(input()).not.toHaveAttribute("aria-invalid")
    })

    it("refocusing a committed field clears a paste error with the entry", async () => {
      const { user, input } = renderTin()
      await user.type(input(), DIGITS)
      await user.paste("1")
      expect(screen.getByRole("alert")).toBeInTheDocument()
      await user.tab()

      await user.click(input())
      expect(input().value).toBe("")
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
      expect(input()).not.toHaveAttribute("aria-invalid")
    })

    it("refuses a paste that would overflow the digits already entered", async () => {
      const { user, input, onValueChange } = renderTin()
      await user.type(input(), "9876")
      await user.paste("54321")
      expect(onValueChange).toHaveBeenLastCalledWith(DIGITS)

      await user.keyboard("{Backspace}")
      await user.paste("12")
      expect(screen.getByRole("alert")).toBeInTheDocument()
    })
  })

  describe("kind", () => {
    it("groups an SSN as ###-##-####", async () => {
      const { user, input } = renderTin({ kind: "ssn" })
      await user.type(input(), DIGITS)
      expect(input().value).toBe("•••-••-••••")
      await user.tab()
      expect(input().value).toBe("•••-••-4321")
    })

    it("groups an EIN as ##-#######", async () => {
      const { user, input } = renderTin({ kind: "ein" })
      await user.type(input(), DIGITS)
      expect(input().value).toBe("••-•••••••")
      await user.tab()
      expect(input().value).toBe("••-•••4321")
    })
  })

  describe("on file", () => {
    it("renders the last-four echo and a Replace button", () => {
      renderTin({ lastFour: "6789" })
      const echo = screen.getByLabelText("Taxpayer ID") as HTMLInputElement
      expect(echo.value).toBe("On file · ending 6789")
      expect(echo).toHaveAttribute("readonly")
      expect(screen.getByRole("button", { name: "Replace" })).toHaveAttribute("type", "button")
    })

    it("never renders more than four digits of lastFour", () => {
      const { container } = renderTin({ lastFour: "123456789" })
      expect(container.innerHTML).not.toMatch(/\d{5,}/)
      expect((screen.getByLabelText("Taxpayer ID") as HTMLInputElement).value).toBe(
        "On file · ending 6789"
      )
    })

    it("Replace swaps in an empty, focused field and calls onReplace", async () => {
      const onReplace = vi.fn()
      const { user, input, onValueChange } = renderTin({ lastFour: "6789", onReplace })
      await user.click(screen.getByRole("button", { name: "Replace" }))

      expect(onReplace).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole("button", { name: "Replace" })).not.toBeInTheDocument()
      expect(input().value).toBe("")
      expect(input()).not.toHaveAttribute("readonly")
      expect(input()).toHaveFocus()

      await user.type(input(), DIGITS, { skipClick: true })
      expect(onValueChange).toHaveBeenLastCalledWith(DIGITS)
    })

    it("returns to the on-file echo when lastFour changes after Replace", async () => {
      const onValueChange = vi.fn()
      const user = userEvent.setup()
      const tree = (lastFour: string) => (
        <Field>
          <FieldLabel htmlFor="tin">Taxpayer ID</FieldLabel>
          <TinInput id="tin" kind="ssn" lastFour={lastFour} onValueChange={onValueChange} />
        </Field>
      )
      const field = () => screen.getByLabelText("Taxpayer ID") as HTMLInputElement
      const { rerender } = render(tree("6789"))
      await user.click(screen.getByRole("button", { name: "Replace" }))
      await user.type(field(), DIGITS, { skipClick: true })

      // The consumer saves as soon as the entry is complete, before any blur,
      // and passes the new last four.
      rerender(tree("4321"))
      expect(field().value).toBe("On file · ending 4321")

      // A second Replace starts empty too, and says so.
      await user.click(screen.getByRole("button", { name: "Replace" }))
      expect(field().value).toBe("")
      expect(onValueChange).toHaveBeenLastCalledWith(null)
    })

    it("Replace is keyboard-reachable", async () => {
      const { user } = renderTin({ lastFour: "6789" })
      await user.tab()
      await user.tab()
      expect(screen.getByRole("button", { name: "Replace" })).toHaveFocus()
      await user.keyboard("{Enter}")
      expect(screen.getByLabelText("Taxpayer ID")).toHaveFocus()
    })

    it("disabled disables the echo and Replace", () => {
      renderTin({ lastFour: "6789", disabled: true })
      expect(screen.getByLabelText("Taxpayer ID")).toBeDisabled()
      expect(screen.getByRole("button", { name: "Replace" })).toBeDisabled()
    })
  })

  describe("no reveal", () => {
    it("no element toggles a reveal", async () => {
      const { user, input, container } = renderTin()
      expect(screen.queryAllByRole("button")).toHaveLength(0)
      expect(container.querySelector("[aria-pressed]")).toBeNull()

      await user.type(input(), DIGITS)
      await user.tab()
      expect(screen.queryAllByRole("button")).toHaveLength(0)
      expect(input()).toHaveAttribute("type", "text")
      expect(input()).not.toHaveAttribute("title")
      expect(input()).not.toHaveAttribute("name")
    })

    it("copying the field yields only the mask", async () => {
      const { user, input } = renderTin()
      await user.type(input(), DIGITS)
      input().setSelectionRange(0, input().value.length)
      const clipboard = await user.copy()
      expect(clipboard?.getData("text")).not.toMatch(/\d/)
    })
  })

  describe("attributes", () => {
    it("carries the password-manager ignore attributes", () => {
      const { input } = renderTin()
      expect(input()).toHaveAttribute("data-1p-ignore", "true")
      expect(input()).toHaveAttribute("data-bwignore", "true")
      expect(input()).toHaveAttribute("data-lpignore", "true")
      expect(input()).toHaveAttribute("data-form-type", "other")
    })

    it("keeps them even inside a form that allows password managers", () => {
      render(
        <PasswordManagersProvider value="allow">
          <TinInput aria-label="Taxpayer ID" kind="ssn" onValueChange={() => {}} />
        </PasswordManagersProvider>
      )
      expect(screen.getByLabelText("Taxpayer ID")).toHaveAttribute("data-1p-ignore", "true")
    })

    it("carries the inputMode and autoComplete hygiene", () => {
      const { input } = renderTin()
      expect(input()).toHaveAttribute("inputmode", "numeric")
      expect(input()).toHaveAttribute("autocomplete", "off")
      expect(input()).toHaveAttribute("autocorrect", "off")
      expect(input()).toHaveAttribute("autocapitalize", "off")
      expect(input()).toHaveAttribute("spellcheck", "false")
      expect(input()).toHaveAttribute("enterkeyhint", "next")
    })

    it("binds the hint, the error and the consumer's description by aria-describedby", () => {
      render(
        <>
          <p id="extra">Used for your 1099</p>
          <TinInput
            aria-label="Taxpayer ID"
            aria-describedby="extra"
            kind="ssn"
            error="Enter all 9 digits"
            onValueChange={() => {}}
          />
        </>
      )
      const input = screen.getByLabelText("Taxpayer ID")
      const ids = input.getAttribute("aria-describedby")!.split(" ")
      const described = ids.map((id) => document.getElementById(id)?.textContent)
      expect(described).toEqual(["Used for your 1099", "9 digits", "Enter all 9 digits"])
      expect(input).toHaveAttribute("aria-invalid", "true")
      expect(screen.getByRole("alert")).toHaveTextContent("Enter all 9 digits")
    })

    it("renders the hint below the control and above the error, in Field order", () => {
      const { input } = renderTin({ error: "Enter all 9 digits" })
      const hint = screen.getByText("9 digits")
      const error = screen.getByRole("alert")
      expect(input().compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(hint.compareDocumentPosition(error) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it("describes the committed echo as ending in the last four", async () => {
      const { user, input } = renderTin()
      await user.type(input(), DIGITS)
      await user.tab()
      expect(input()).toHaveAccessibleDescription(/ending in 4321/)
    })

    it("forwards its ref to the input", () => {
      const ref = { current: null as HTMLInputElement | null }
      render(<TinInput ref={ref} aria-label="Taxpayer ID" kind="ssn" onValueChange={() => {}} />)
      expect(ref.current).toBe(screen.getByLabelText("Taxpayer ID"))
    })

    it("server-renders the field read-only, so nothing typed before hydration is shown", () => {
      const html = renderToString(<TinInput aria-label="Taxpayer ID" kind="ssn" onValueChange={() => {}} />)
      expect(html).toMatch(/<input[^>]*readonly/i)
      render(<TinInput aria-label="Hydrated" kind="ssn" onValueChange={() => {}} />)
      expect(screen.getByLabelText("Hydrated")).not.toHaveAttribute("readonly")
    })

    it("disables the field", () => {
      const { input } = renderTin({ disabled: true })
      expect(input()).toBeDisabled()
    })
  })
})
