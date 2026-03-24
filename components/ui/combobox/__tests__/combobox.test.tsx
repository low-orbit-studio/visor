import { render, screen, waitFor } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxSeparator,
} from "../combobox"
import { checkA11y } from "../../../../test-utils/a11y"

const fruits = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
]

function renderCombobox(props?: Partial<React.ComponentProps<typeof Combobox>>) {
  return render(
    <Combobox {...props}>
      <ComboboxInput placeholder="Search fruits..." aria-label="Fruit selector" />
      <ComboboxContent>
        {fruits.map((fruit) => (
          <ComboboxItem key={fruit.value} value={fruit.value} label={fruit.label}>
            {fruit.label}
          </ComboboxItem>
        ))}
      </ComboboxContent>
    </Combobox>
  )
}

describe("Combobox", () => {
  it("renders the input", () => {
    renderCombobox()
    const input = screen.getByRole("combobox")
    expect(input).toBeInTheDocument()
  })

  it("shows placeholder text", () => {
    renderCombobox()
    const input = screen.getByPlaceholderText("Search fruits...")
    expect(input).toBeInTheDocument()
  })

  it("opens content when input is focused", async () => {
    const user = userEvent.setup()
    renderCombobox()
    const input = screen.getByRole("combobox")
    await user.click(input)
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument()
    })
  })

  it("shows items when open", async () => {
    const user = userEvent.setup()
    renderCombobox({ defaultOpen: true })
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument()
    })
  })

  it("selects an item when clicked", async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    renderCombobox({ defaultOpen: true, onSelect: handleSelect })
    await waitFor(() => screen.getByRole("option", { name: "Banana" }))
    await user.click(screen.getByRole("option", { name: "Banana" }))
    expect(handleSelect).toHaveBeenCalledWith("banana", "Banana")
  })

  it("updates input value when item is selected", async () => {
    const user = userEvent.setup()
    renderCombobox({ defaultOpen: true })
    await waitFor(() => screen.getByRole("option", { name: "Cherry" }))
    await user.click(screen.getByRole("option", { name: "Cherry" }))
    const input = screen.getByRole("combobox") as HTMLInputElement
    expect(input.value).toBe("Cherry")
  })

  it("closes popover after selection", async () => {
    const user = userEvent.setup()
    renderCombobox({ defaultOpen: true })
    await waitFor(() => screen.getByRole("option", { name: "Apple" }))
    await user.click(screen.getByRole("option", { name: "Apple" }))
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })
  })

  it("renders with a default value", () => {
    renderCombobox({ defaultValue: "banana", defaultInputValue: "Banana" })
    const input = screen.getByRole("combobox") as HTMLInputElement
    expect(input.value).toBe("Banana")
  })

  it("shows aria-expanded=true when open", async () => {
    const user = userEvent.setup()
    renderCombobox()
    const input = screen.getByRole("combobox")
    await user.click(input)
    await waitFor(() => {
      expect(input).toHaveAttribute("aria-expanded", "true")
    })
  })

  it("shows aria-expanded=false when closed", () => {
    renderCombobox()
    const input = screen.getByRole("combobox")
    expect(input).toHaveAttribute("aria-expanded", "false")
  })

  it("updates input value when typing", async () => {
    const user = userEvent.setup()
    renderCombobox()
    const input = screen.getByRole("combobox") as HTMLInputElement
    await user.type(input, "app")
    expect(input.value).toBe("app")
  })
})

describe("ComboboxEmpty", () => {
  it("renders empty state", () => {
    render(
      <Combobox defaultOpen>
        <ComboboxInput aria-label="Search" />
        <ComboboxContent>
          <ComboboxEmpty />
        </ComboboxContent>
      </Combobox>
    )
    expect(screen.getByText("No results found.")).toBeInTheDocument()
  })

  it("renders custom empty message", () => {
    render(
      <Combobox defaultOpen>
        <ComboboxInput aria-label="Search" />
        <ComboboxContent>
          <ComboboxEmpty>Nothing here</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    )
    expect(screen.getByText("Nothing here")).toBeInTheDocument()
  })
})

describe("ComboboxGroup", () => {
  it("renders grouped items", async () => {
    render(
      <Combobox defaultOpen>
        <ComboboxInput aria-label="Search" />
        <ComboboxContent>
          <ComboboxGroup heading="Fruits">
            <ComboboxItem value="apple" label="Apple">Apple</ComboboxItem>
          </ComboboxGroup>
        </ComboboxContent>
      </Combobox>
    )
    await waitFor(() => {
      expect(screen.getByText("Fruits")).toBeInTheDocument()
      expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument()
    })
  })
})

describe("ComboboxSeparator", () => {
  it("renders a separator", async () => {
    render(
      <Combobox defaultOpen>
        <ComboboxInput aria-label="Search" />
        <ComboboxContent>
          <ComboboxItem value="a" label="A">A</ComboboxItem>
          <ComboboxSeparator />
          <ComboboxItem value="b" label="B">B</ComboboxItem>
        </ComboboxContent>
      </Combobox>
    )
    await waitFor(() => {
      // Popover renders via Portal into document.body
      const sep = document.body.querySelector('[data-slot="combobox-separator"]')
      expect(sep).toBeInTheDocument()
    })
  })
})

describe("Combobox keyboard navigation", () => {
  it("selects item with Enter key", async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    renderCombobox({ defaultOpen: true, onSelect: handleSelect })
    await waitFor(() => screen.getByRole("option", { name: "Apple" }))
    const appleOption = screen.getByRole("option", { name: "Apple" })
    appleOption.focus()
    await user.keyboard("{Enter}")
    expect(handleSelect).toHaveBeenCalledWith("apple", "Apple")
  })

  it("selects item with Space key", async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    renderCombobox({ defaultOpen: true, onSelect: handleSelect })
    await waitFor(() => screen.getByRole("option", { name: "Banana" }))
    const bananaOption = screen.getByRole("option", { name: "Banana" })
    bananaOption.focus()
    await user.keyboard(" ")
    expect(handleSelect).toHaveBeenCalledWith("banana", "Banana")
  })

  it("closes on Escape key", async () => {
    const user = userEvent.setup()
    renderCombobox({ defaultOpen: true })
    await waitFor(() => screen.getByRole("listbox"))
    await user.keyboard("{Escape}")
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    })
  })
})

describe("Combobox accessibility", () => {
  it("has no WCAG 2.1 AA violations (closed)", async () => {
    const { container } = renderCombobox()
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (open)", async () => {
    const user = userEvent.setup()
    const { container } = renderCombobox()
    const input = screen.getByRole("combobox")
    await user.click(input)
    await waitFor(() => screen.getByRole("listbox"))
    await checkA11y(document.body)
  })
})
