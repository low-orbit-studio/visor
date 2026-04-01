import { render, screen, cleanup } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { checkA11y } from "../../../../test-utils/a11y"
import { PhoneInput } from "../phone-input"

// Mock intl-tel-input
const mockItiInstance = {
  getNumber: vi.fn(() => "+14155551234"),
  isValidNumber: vi.fn(() => true),
  destroy: vi.fn(),
}

const mockIntlTelInput = vi.fn(() => mockItiInstance)

vi.mock("intl-tel-input/intlTelInputWithUtils", () => ({
  default: mockIntlTelInput,
}))

vi.mock("intl-tel-input/styles", () => ({}))

describe("PhoneInput", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      text: () => Promise.resolve("us"),
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("renders input with type tel", () => {
    render(<PhoneInput name="phone" />)
    const input = screen.getByRole("textbox")
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute("type", "tel")
  })

  it("renders with autocomplete tel", () => {
    render(<PhoneInput name="phone" />)
    const input = screen.getByRole("textbox")
    expect(input).toHaveAttribute("autocomplete", "tel")
  })

  it("applies id and name attributes", () => {
    render(<PhoneInput id="phone-field" name="phone" />)
    const input = screen.getByRole("textbox")
    expect(input).toHaveAttribute("id", "phone-field")
    expect(input).toHaveAttribute("name", "phone")
  })

  it("applies placeholder", () => {
    render(<PhoneInput name="phone" placeholder="Enter phone" />)
    const input = screen.getByRole("textbox")
    expect(input).toHaveAttribute("placeholder", "Enter phone")
  })

  it("applies required attribute", () => {
    render(<PhoneInput name="phone" required />)
    const input = screen.getByRole("textbox")
    expect(input).toBeRequired()
  })

  it("applies disabled attribute", () => {
    render(<PhoneInput name="phone" disabled />)
    const input = screen.getByRole("textbox")
    expect(input).toBeDisabled()
  })

  it("applies custom className to wrapper", () => {
    render(<PhoneInput name="phone" className="custom-class" />)
    const wrapper = screen.getByRole("textbox").closest("[data-slot='phone-input']")
    expect(wrapper).toHaveClass("custom-class")
  })

  it("sets default value", () => {
    render(<PhoneInput name="phone" value="+14155551234" />)
    const input = screen.getByRole("textbox")
    expect(input).toHaveValue("+14155551234")
  })

  it("renders data-slot attribute on wrapper", () => {
    render(<PhoneInput name="phone" />)
    const wrapper = screen.getByRole("textbox").closest("[data-slot='phone-input']")
    expect(wrapper).toBeInTheDocument()
  })

  it("forwards ref correctly", () => {
    const ref = { current: null } as React.RefObject<HTMLInputElement | null>
    render(<PhoneInput ref={ref} name="phone" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})

describe("PhoneInput onChange signature", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      text: () => Promise.resolve("us"),
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("onChange receives (value, isValid) signature", async () => {
    const handleChange = vi.fn()
    render(<PhoneInput name="phone" onChange={handleChange} />)

    // Wait for intl-tel-input to initialize
    await vi.waitFor(() => {
      expect(mockIntlTelInput).toHaveBeenCalled()
    })

    // Simulate the input event that intl-tel-input listens to
    const input = screen.getByRole("textbox")
    input.dispatchEvent(new Event("input", { bubbles: true }))

    expect(handleChange).toHaveBeenCalledWith("+14155551234", true)
  })
})

describe("PhoneInput focus stability", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      text: () => Promise.resolve("us"),
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("maintains focus after parent re-render with new onChange", () => {
    const onChange = vi.fn()
    const { rerender } = render(<PhoneInput name="phone" onChange={onChange} />)

    const input = screen.getByRole("textbox")
    input.focus()
    expect(document.activeElement).toBe(input)

    // Simulate parent re-render with new onChange reference
    const newOnChange = vi.fn()
    rerender(<PhoneInput name="phone" onChange={newOnChange} />)

    // Input should still have focus — component should NOT re-initialize
    expect(document.activeElement).toBe(input)
  })
})

describe("PhoneInput SSR safety", () => {
  it("renders without throwing during initial render", () => {
    expect(() => {
      render(<PhoneInput name="phone" />)
    }).not.toThrow()
  })

  it("renders a basic input with all props before mounting", () => {
    render(
      <PhoneInput
        id="test-id"
        name="test-name"
        value="+1234567890"
        placeholder="Test placeholder"
        required
        disabled
        className="test-class"
      />
    )

    const input = screen.getByRole("textbox")
    expect(input).toHaveAttribute("id", "test-id")
    expect(input).toHaveAttribute("name", "test-name")
    expect(input).toHaveAttribute("placeholder", "Test placeholder")
    expect(input).toBeRequired()
    expect(input).toBeDisabled()
  })
})

describe("PhoneInput intl-tel-input mock", () => {
  it("mocks intl-tel-input via vi.mock", () => {
    expect(mockIntlTelInput).toBeDefined()
    expect(typeof mockIntlTelInput).toBe("function")
  })
})

describe("PhoneInput accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <PhoneInput name="phone" placeholder="Enter phone number" />
    )
    await checkA11y(container)
  })
})
