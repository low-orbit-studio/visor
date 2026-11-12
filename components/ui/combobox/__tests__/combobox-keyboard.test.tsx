import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { Combobox, ComboboxInput, ComboboxContent, ComboboxItem } from "../combobox"

const states = [
  { value: "nevada", label: "Nevada" },
  { value: "new-york", label: "New York" },
  { value: "ohio", label: "Ohio" },
  { value: "oregon", label: "Oregon", disabled: true },
  { value: "texas", label: "Texas" },
]

/** The Combobox leaves filtering to the consumer, the way Animal's pickers use it. */
function FilteredCombobox({ onSelect }: { onSelect?: (value: string, label: string) => void }) {
  const [query, setQuery] = React.useState("")
  const visible = states.filter((s) => s.label.toLowerCase().includes(query.toLowerCase()))
  return (
    <Combobox inputValue={query} onInputChange={setQuery} onSelect={onSelect}>
      <ComboboxInput aria-label="State" />
      <ComboboxContent>
        {visible.map((s) => (
          <ComboboxItem key={s.value} value={s.value} label={s.label} disabled={s.disabled}>
            {s.label}
          </ComboboxItem>
        ))}
      </ComboboxContent>
    </Combobox>
  )
}

function setup() {
  const onSelect = vi.fn()
  const user = userEvent.setup()
  render(<FilteredCombobox onSelect={onSelect} />)
  const input = screen.getByRole("combobox")
  return { user, input, onSelect }
}

const highlighted = (input: HTMLElement) => {
  const id = input.getAttribute("aria-activedescendant")
  return id ? document.getElementById(id)?.textContent : null
}

describe("Combobox keyboard", () => {
  it("type 'ne', Arrow Down twice, Enter picks the second match and closes the list", async () => {
    const { user, input, onSelect } = setup()
    await user.type(input, "ne")
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}")
    expect(onSelect).toHaveBeenCalledWith("new-york", "New York")
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument())
    expect(input).toHaveAttribute("aria-expanded", "false")
    expect(input).toHaveValue("New York")
  })

  it("typing highlights the first match and Enter picks it with no arrow press", async () => {
    const { user, input, onSelect } = setup()
    await user.type(input, "new")
    await waitFor(() => expect(highlighted(input)).toBe("New York"))
    await user.keyboard("{Enter}")
    expect(onSelect).toHaveBeenCalledWith("new-york", "New York")
  })

  it("Escape closes without picking; a second Escape clears the text", async () => {
    const { user, input, onSelect } = setup()
    await user.type(input, "ne")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument())
    expect(onSelect).not.toHaveBeenCalled()
    expect(input).toHaveValue("ne")
    await user.keyboard("{Escape}")
    expect(input).toHaveValue("")
  })

  it("skips disabled options and names the highlighted option in aria-activedescendant", async () => {
    const { user, input } = setup()
    await user.click(input)
    await screen.findByRole("listbox")
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}")
    // Nevada, New York, Ohio, then Texas — Oregon is disabled.
    expect(highlighted(input)).toBe("Texas")
    const option = screen.getByRole("option", { name: "Texas" })
    expect(input).toHaveAttribute("aria-activedescendant", option.id)
    expect(option).toHaveAttribute("data-highlighted")
  })

  it("does not wrap at either end", async () => {
    const { user, input } = setup()
    await user.click(input)
    await screen.findByRole("listbox")
    await user.keyboard("{ArrowDown}{ArrowUp}{ArrowUp}")
    expect(highlighted(input)).toBe("Nevada")
    await user.keyboard("{End}{ArrowDown}")
    expect(highlighted(input)).toBe("Texas")
    await user.keyboard("{Home}")
    expect(highlighted(input)).toBe("Nevada")
  })

  it("Arrow Down opens a closed list and highlights the first option", async () => {
    const { user, input } = setup()
    await user.type(input, "oh")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument())
    expect(input).not.toHaveAttribute("aria-activedescendant")
    await user.keyboard("{ArrowDown}")
    await waitFor(() => expect(highlighted(input)).toBe("Ohio"))
    expect(input).toHaveAttribute("aria-expanded", "true")
    expect(input).toHaveAttribute("aria-controls", screen.getByRole("listbox").id)
  })

  it("Tab picks nothing and closes the list", async () => {
    const { user, input, onSelect } = setup()
    await user.type(input, "ne")
    await user.keyboard("{Tab}")
    expect(onSelect).not.toHaveBeenCalled()
    await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "false"))
  })

  it("mouse hover moves the highlight", async () => {
    const { user, input } = setup()
    await user.click(input)
    await user.hover(await screen.findByRole("option", { name: "Ohio" }))
    expect(highlighted(input)).toBe("Ohio")
    await user.hover(screen.getByRole("option", { name: "Oregon" }))
    expect(highlighted(input)).toBe("Ohio")
  })

  it("gives each option a stable id that is a valid IDREF", async () => {
    const { user, input } = setup()
    await user.click(input)
    const option = await screen.findByRole("option", { name: "New York" })
    const id = option.id
    expect(id).not.toMatch(/\s/)
    await user.type(input, "new")
    expect(screen.getByRole("option", { name: "New York" }).id).toBe(id)
  })
})
