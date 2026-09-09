import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { describe, it, expect, vi, afterEach } from "vitest"
import * as React from "react"
import type { IntlTelInputRef } from "@intl-tel-input/react"
import { checkA11y } from "../../../../test-utils/a11y"
import { PhoneInput } from "../phone-input"
import type { PhoneInputProps } from "../phone-input"

// These tests drive the real intl-tel-input v29 wrapper — the malformed-partial
// behaviour they guard against only exists in the real library, so mocking it
// would test the mock.

const E164 = /^\+[1-9]\d{1,14}$/

/** Type into the field the way the library's own `onInput` listener sees it. */
function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(input),
    "value"
  )!.set!
  setter.call(input, value)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

/** Render and wait until the library's utils have loaded and validation is live. */
async function setup(props: PhoneInputProps = {}) {
  const ref = React.createRef<IntlTelInputRef>()
  const result = render(<PhoneInput ref={ref} name="phone" {...props} />)
  const input = screen.getByRole("textbox") as HTMLInputElement
  await waitFor(() => expect(ref.current?.getInstance()).toBeTruthy())
  await ref.current!.getInstance()!.promise
  return { ...result, ref, input }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("PhoneInput rendering", () => {
  it("renders an input with type tel and autocomplete tel", async () => {
    const { input } = await setup({ name: "phone" })
    expect(input).toHaveAttribute("type", "tel")
    expect(input).toHaveAttribute("autocomplete", "tel")
  })

  it("applies id, name and placeholder", async () => {
    const { input } = await setup({ id: "phone-field", name: "phone", placeholder: "Enter phone" })
    expect(input).toHaveAttribute("id", "phone-field")
    expect(input).toHaveAttribute("name", "phone")
    expect(input).toHaveAttribute("placeholder", "Enter phone")
  })

  it("applies required and disabled", async () => {
    const { input } = await setup({ name: "phone", required: true, disabled: true })
    expect(input).toBeRequired()
    expect(input).toBeDisabled()
  })

  it("applies custom className and data-slot to the wrapper", async () => {
    await setup({ name: "phone", className: "custom-class" })
    const wrapper = screen
      .getByRole("textbox")
      .closest("[data-slot='phone-input']")
    expect(wrapper).toBeInTheDocument()
    expect(wrapper).toHaveClass("custom-class")
  })

  it("suppresses password managers", async () => {
    const { input } = await setup({ name: "phone" })
    expect(input).toHaveAttribute("data-1p-ignore")
    expect(input).toHaveAttribute("data-lpignore", "true")
    expect(input).toHaveAttribute("data-bwignore")
    expect(input).toHaveAttribute("data-form-type", "other")
  })

  it("exposes the library instance through the forwarded ref", async () => {
    const { ref } = await setup({ name: "phone" })
    expect(ref.current?.getInstance()).toBeTruthy()
    expect(ref.current?.getInput()).toBeInstanceOf(HTMLInputElement)
  })
})

describe("PhoneInput onChange contract", () => {
  it("emits (null, false) for a partial number — never a malformed string", async () => {
    const onChange = vi.fn()
    const { input } = await setup({ name: "phone", onChange })

    type(input, "21337")
    await waitFor(() => expect(onChange).toHaveBeenCalled())

    expect(onChange).toHaveBeenLastCalledWith(null, false)
    // The library's own getNumber() would have produced "+1213-37" here.
    for (const [emitted] of onChange.mock.calls) {
      if (emitted !== null) expect(emitted).toMatch(E164)
    }
  })

  it("emits E.164 once the number is complete", async () => {
    const onChange = vi.fn()
    const { input } = await setup({ name: "phone", onChange })

    type(input, "2133734253")
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith("+12133734253", true))
    expect(onChange.mock.lastCall![0]).toMatch(E164)
  })

  it("re-emits (null, false) when a complete number is backspaced to a partial", async () => {
    const onChange = vi.fn()
    const { input } = await setup({ name: "phone", onChange })

    type(input, "2133734253")
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith("+12133734253", true))

    type(input, "213373425")
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(null, false))
  })

  it("never emits a non-E.164 string across type → complete → backspace → clear", async () => {
    const onChange = vi.fn()
    const { input } = await setup({ name: "phone", onChange })

    for (const step of ["2", "21", "213", "21337", "2133734253", "213373", "", "2133734253"]) {
      type(input, step)
      await new Promise((r) => setTimeout(r, 0))
    }

    expect(onChange).toHaveBeenCalled()
    for (const [emitted, isValid] of onChange.mock.calls) {
      if (emitted === null) {
        expect(isValid).toBe(false)
      } else {
        expect(emitted).toMatch(E164)
        expect(isValid).toBe(true)
      }
    }
  })

  it("switches country and emits E.164 when a foreign number is pasted", async () => {
    const onChange = vi.fn()
    const { input, ref } = await setup({ name: "phone", onChange })

    type(input, "+61412345678")
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith("+61412345678", true)
    )
    expect(ref.current!.getInstance()!.getSelectedCountry()?.iso2).toBe("au")
  })
})

describe("PhoneInput controlled usage", () => {
  // A realistic controlled consumer: holds the emitted value (null while the
  // number is partial) and passes an inline onChange, so the callback identity
  // changes on every render.
  function Controlled() {
    const [phone, setPhone] = React.useState<string | null>(null)
    const [tick, setTick] = React.useState(0)
    return (
      <div>
        <PhoneInput name="phone" value={phone} onChange={(e164) => setPhone(e164)} />
        <button data-testid="rerender" onClick={() => setTick((t) => t + 1)}>
          {tick}
        </button>
      </div>
    )
  }

  it("keeps the user's partial across blur and an unrelated re-render", async () => {
    render(<Controlled />)
    const input = screen.getByRole("textbox") as HTMLInputElement
    await new Promise((r) => setTimeout(r, 200))

    type(input, "21337")
    await waitFor(() => expect(input.value).toBe("213-37"))

    // The emitted value is null for a partial, so the controlled `value` is null.
    // The wrapper writes `value` back to the input whenever its internal update
    // callback changes identity — which, before emit was stabilised, erased the
    // partial the moment the field lost focus and anything re-rendered.
    fireEvent.blur(input)
    await new Promise((r) => setTimeout(r, 50))
    expect(input.value).toBe("213-37")

    fireEvent.click(screen.getByTestId("rerender"))
    await new Promise((r) => setTimeout(r, 100))
    expect(input.value).toBe("213-37")
  })

  it("round-trips a complete number back through a controlled parent", async () => {
    render(<Controlled />)
    const input = screen.getByRole("textbox") as HTMLInputElement
    await new Promise((r) => setTimeout(r, 200))

    type(input, "2133734253")
    await waitFor(() => expect(input.value).toBe("213-373-4253"))

    fireEvent.blur(input)
    fireEvent.click(screen.getByTestId("rerender"))
    await new Promise((r) => setTimeout(r, 100))
    expect(input.value).toBe("213-373-4253")
  })
})

describe("PhoneInput value round-trip", () => {
  it("displays a formatted national number with the US flag and +1 dial code", async () => {
    const { input } = await setup({ name: "phone", value: "+12133734253" })

    await waitFor(() => expect(input.value).toBe("213-373-4253"))
    expect(document.querySelector(".iti__flag")).toHaveClass("iti__us")
    expect(document.querySelector(".iti__selected-dial-code")).toHaveTextContent(
      "+1"
    )
  })
})

describe("PhoneInput country selector", () => {
  it("renders the selected country as a button by default", async () => {
    await setup({ name: "phone" })
    expect(document.querySelector(".iti__selected-country")?.tagName).toBe(
      "BUTTON"
    )
  })

  it("renders the selected country as a div when countrySelectorMode is OFF", async () => {
    await setup({ name: "phone", countrySelectorMode: "OFF" })
    expect(document.querySelector(".iti__selected-country")?.tagName).toBe("DIV")
  })

  it("keeps the country selector inline (not portaled) by default", async () => {
    await setup({ name: "phone" })
    expect(document.querySelector(".iti")).toHaveClass(
      "iti--inline-country-selector"
    )
  })

  it("applies readOnly to the input", async () => {
    const { input } = await setup({ name: "phone", readOnly: true })
    await waitFor(() => expect(input).toHaveAttribute("readonly"))
  })
})

describe("PhoneInput blur validation", () => {
  it("reports the validation error for a non-empty partial", async () => {
    const onBlur = vi.fn()
    const { input } = await setup({ name: "phone", onBlur })

    type(input, "21337")
    await new Promise((r) => setTimeout(r, 0))
    fireEvent.blur(input)

    await waitFor(() => expect(onBlur).toHaveBeenCalledWith("TOO_SHORT"))
  })

  it("reports no error for an empty field", async () => {
    const onBlur = vi.fn()
    const { input } = await setup({ name: "phone", onBlur })

    fireEvent.blur(input)

    await waitFor(() => expect(onBlur).toHaveBeenCalledWith(null))
  })

  it("reports no error for a complete number", async () => {
    const onBlur = vi.fn()
    const { input } = await setup({ name: "phone", onBlur })

    type(input, "2133734253")
    await new Promise((r) => setTimeout(r, 0))
    fireEvent.blur(input)

    await waitFor(() => expect(onBlur).toHaveBeenCalledWith(null))
  })
})

describe("PhoneInput size variants", () => {
  it.each(["sm", "md", "lg"] as const)("applies data-size %s", async (size) => {
    await setup({ name: "phone", size })
    expect(
      screen.getByRole("textbox").closest("[data-slot='phone-input']")
    ).toHaveAttribute("data-size", size)
  })

  it("defaults to data-size md", async () => {
    await setup({ name: "phone" })
    expect(
      screen.getByRole("textbox").closest("[data-slot='phone-input']")
    ).toHaveAttribute("data-size", "md")
  })
})

describe("PhoneInput SSR safety", () => {
  it("renders on the server without throwing", () => {
    const html = renderToString(
      <PhoneInput id="ssr" name="phone" placeholder="Enter phone number" />
    )
    expect(html).toContain('type="tel"')
    expect(html).toContain('id="ssr"')
  })
})

describe("PhoneInput accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = await setup({ name: "phone", placeholder: "Enter phone number" })
    await checkA11y(container)
  })
})
