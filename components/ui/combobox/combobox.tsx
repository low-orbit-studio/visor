"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./combobox.module.css"

/* ─── Context ───────────────────────────────────────────────────────── */

interface ComboboxContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  inputValue: string
  setInputValue: (value: string) => void
  selectedValue: string
  setSelectedValue: (value: string) => void
  onSelect?: (value: string, label: string) => void
  listboxId: string
  /** Element id of the highlighted option, announced via aria-activedescendant */
  activeId: string | null
  setActiveId: (id: string | null) => void
  /** Highlight the first enabled option once the list has rendered */
  highlightFirst: () => void
  /** Items call this on mount so a pending highlightFirst can resolve */
  registerItem: () => void
}

const ComboboxContext = React.createContext<ComboboxContextValue | undefined>(undefined)

/** Enabled options in DOM order — the order the user sees. */
function getEnabledOptions(listboxId: string): HTMLElement[] {
  const listbox = document.getElementById(listboxId)
  return listbox
    ? Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"]:not([data-disabled])'))
    : []
}

function useComboboxContext() {
  const ctx = React.useContext(ComboboxContext)
  if (!ctx) {
    throw new Error("Combobox subcomponents must be rendered inside <Combobox>")
  }
  return ctx
}

/* ─── Combobox (root) ───────────────────────────────────────────────── */

export interface ComboboxProps {
  /** Current input/search text (controlled) */
  inputValue?: string
  /** Default input text (uncontrolled) */
  defaultInputValue?: string
  /** Called when the input text changes */
  onInputChange?: (value: string) => void
  /** Currently selected value (controlled) */
  value?: string
  /** Default selected value (uncontrolled) */
  defaultValue?: string
  /** Called when a value is selected */
  onSelect?: (value: string, label: string) => void
  /** Whether the popover is open (controlled) */
  open?: boolean
  /** Default open state (uncontrolled) */
  defaultOpen?: boolean
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Whether the combobox is disabled */
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

const Combobox = React.forwardRef<HTMLDivElement, ComboboxProps>(
  (
    {
      inputValue: controlledInput,
      defaultInputValue = "",
      onInputChange,
      value: controlledValue,
      defaultValue = "",
      onSelect,
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      disabled,
      children,
      className,
    },
    ref
  ) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
    const [uncontrolledInput, setUncontrolledInput] = React.useState(defaultInputValue)
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)

    const listboxId = React.useId()
    const [activeId, setActiveId] = React.useState<string | null>(null)
    const highlightFirstRef = React.useRef(false)
    // Bumped by each item on mount: the portal renders after open flips, so the
    // first-option lookup has to retry once the options exist.
    const [itemsVersion, registerItem] = React.useReducer((n: number) => n + 1, 0)
    const highlightFirst = React.useCallback(() => {
      highlightFirstRef.current = true
      setActiveId(null)
    }, [])

    const isOpenControlled = controlledOpen !== undefined
    const isInputControlled = controlledInput !== undefined
    const isValueControlled = controlledValue !== undefined

    const open = isOpenControlled ? controlledOpen! : uncontrolledOpen
    const inputValue = isInputControlled ? controlledInput! : uncontrolledInput
    const selectedValue = isValueControlled ? controlledValue! : uncontrolledValue

    const setOpen = React.useCallback(
      (next: boolean) => {
        if (!isOpenControlled) setUncontrolledOpen(next)
        onOpenChange?.(next)
      },
      [isOpenControlled, onOpenChange]
    )

    const setInputValue = React.useCallback(
      (next: string) => {
        if (!isInputControlled) setUncontrolledInput(next)
        onInputChange?.(next)
      },
      [isInputControlled, onInputChange]
    )

    const setSelectedValue = React.useCallback(
      (next: string) => {
        if (!isValueControlled) setUncontrolledValue(next)
      },
      [isValueControlled]
    )

    React.useEffect(() => {
      if (!open) {
        setActiveId(null)
        return
      }
      if (!highlightFirstRef.current) return
      const first = getEnabledOptions(listboxId)[0]
      if (first) {
        highlightFirstRef.current = false
        setActiveId(first.id)
      }
    }, [open, inputValue, itemsVersion, listboxId])

    const handleSelect = React.useCallback(
      (value: string, label: string) => {
        setSelectedValue(value)
        setInputValue(label)
        setOpen(false)
        onSelect?.(value, label)
      },
      [setSelectedValue, setInputValue, setOpen, onSelect]
    )

    return (
      <ComboboxContext.Provider
        value={{
          open,
          setOpen,
          inputValue,
          setInputValue,
          selectedValue,
          setSelectedValue,
          onSelect: handleSelect,
          listboxId,
          activeId,
          setActiveId,
          highlightFirst,
          registerItem,
        }}
      >
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
          <div
            ref={ref}
            data-slot="combobox"
            data-disabled={disabled ? "" : undefined}
            className={cn(styles.root, className)}
          >
            {children}
          </div>
        </PopoverPrimitive.Root>
      </ComboboxContext.Provider>
    )
  }
)
Combobox.displayName = "Combobox"

/* ─── ComboboxInput ─────────────────────────────────────────────────── */

export interface ComboboxInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string
}

const ComboboxInput = React.forwardRef<HTMLInputElement, ComboboxInputProps>(
  ({ className, onChange, onFocus, onClick, onKeyDown, placeholder = "Search...", ...props }, ref) => {
    const { inputValue, setInputValue, setOpen, open, listboxId, activeId, setActiveId, highlightFirst } =
      useComboboxContext()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
      highlightFirst()
      if (!open) setOpen(true)
      onChange?.(e)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setOpen(true)
      onFocus?.(e)
    }

    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      setOpen(true)
      onClick?.(e)
    }

    const moveHighlight = (to: "next" | "prev" | "first" | "last") => {
      const options = getEnabledOptions(listboxId)
      if (options.length === 0) return
      const current = options.findIndex((o) => o.id === activeId)
      const last = options.length - 1
      // No wrap at either end, like a native select.
      const index =
        to === "first" ? 0
        : to === "last" ? last
        : to === "next" ? (current < 0 ? 0 : Math.min(current + 1, last))
        : current < 0 ? last : Math.max(current - 1, 0)
      setActiveId(options[index].id)
      options[index].scrollIntoView?.({ block: "nearest" })
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented) return
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          if (open) moveHighlight("next")
          else {
            setOpen(true)
            highlightFirst()
          }
          break
        case "ArrowUp":
          if (!open) break
          e.preventDefault()
          moveHighlight("prev")
          break
        case "Home":
        case "End":
          if (!open) break
          e.preventDefault()
          moveHighlight(e.key === "Home" ? "first" : "last")
          break
        case "Enter": {
          const active = open && activeId ? document.getElementById(activeId) : null
          if (!active) break
          e.preventDefault()
          active.click() // same path as a mouse pick
          break
        }
        case "Escape":
          // First Escape closes the list; a second clears what was typed.
          if (open) setOpen(false)
          else if (inputValue) setInputValue("")
          else break
          e.preventDefault()
          break
        case "Tab":
          if (open) setOpen(false)
          break
      }
    }

    return (
      <PopoverPrimitive.Anchor asChild>
        <div data-slot="combobox-input-wrapper" className={styles.inputWrapper}>
          <input
            ref={ref}
            data-slot="combobox-input"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls={open ? listboxId : undefined}
            aria-activedescendant={open && activeId ? activeId : undefined}
            aria-haspopup="listbox"
            autoComplete="off"
            value={inputValue}
            placeholder={placeholder}
            className={cn(styles.input, className)}
            onChange={handleChange}
            onFocus={handleFocus}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            {...props}
          />
          <CaretDownIcon
            data-slot="combobox-icon"
            className={cn(styles.icon, open && styles.iconOpen)}
            aria-hidden="true"
          />
        </div>
      </PopoverPrimitive.Anchor>
    )
  }
)
ComboboxInput.displayName = "ComboboxInput"

/* ─── ComboboxContent ───────────────────────────────────────────────── */

export interface ComboboxContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  /** Accessible label for the listbox (required for a11y when there is no visible heading) */
  "aria-label"?: string
}

const ComboboxContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  ComboboxContentProps
>(({ className, children, sideOffset = 4, align = "start", "aria-label": ariaLabel, ...props }, ref) => {
  const { listboxId } = useComboboxContext()
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        data-slot="combobox-content"
        sideOffset={sideOffset}
        align={align}
        className={cn(styles.content, className)}
        onOpenAutoFocus={(e) => e.preventDefault()}
        {...props}
      >
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel ?? "Options"}
          className={styles.listbox}
        >
          {children}
        </ul>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  )
})
ComboboxContent.displayName = "ComboboxContent"

/* ─── ComboboxItem ──────────────────────────────────────────────────── */

export interface ComboboxItemProps extends React.HTMLAttributes<HTMLLIElement> {
  value: string
  label?: string
  disabled?: boolean
}

const ComboboxItem = React.forwardRef<HTMLLIElement, ComboboxItemProps>(
  ({ className, value, label, children, disabled, onClick, onMouseMove, id: idProp, ...props }, ref) => {
    const { selectedValue, onSelect, listboxId, activeId, setActiveId, registerItem } = useComboboxContext()
    const isSelected = selectedValue === value
    // Stable per value; encoded so a value with spaces stays a valid IDREF.
    const id = idProp ?? `${listboxId}-option-${encodeURIComponent(value)}`
    const isHighlighted = activeId === id

    React.useEffect(() => registerItem(), [registerItem])

    const handleMouseMove = (e: React.MouseEvent<HTMLLIElement>) => {
      if (!disabled && !isHighlighted) setActiveId(id)
      onMouseMove?.(e)
    }
    const displayLabel = label ?? (typeof children === "string" ? children : "")

    const handleClick = (e: React.MouseEvent<HTMLLIElement>) => {
      if (!disabled) {
        onSelect?.(value, displayLabel)
        onClick?.(e)
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
      if ((e.key === "Enter" || e.key === " ") && !disabled) {
        e.preventDefault()
        onSelect?.(value, displayLabel)
      }
    }

    return (
      <li
        ref={ref}
        id={id}
        role="option"
        aria-selected={isSelected}
        aria-disabled={disabled || undefined}
        data-slot="combobox-item"
        data-selected={isSelected ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        data-highlighted={isHighlighted ? "" : undefined}
        className={cn(styles.item, className)}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        {...props}
      >
        <span className={styles.itemCheck} aria-hidden="true">
          {isSelected && <CheckIcon className={styles.itemCheckIcon} />}
        </span>
        {children ?? label ?? value}
      </li>
    )
  }
)
ComboboxItem.displayName = "ComboboxItem"

/* ─── ComboboxEmpty ─────────────────────────────────────────────────── */

export type ComboboxEmptyProps = React.HTMLAttributes<HTMLLIElement>

const ComboboxEmpty = React.forwardRef<HTMLLIElement, ComboboxEmptyProps>(
  ({ className, children = "No results found.", ...props }, ref) => {
    return (
      <li
        ref={ref}
        data-slot="combobox-empty"
        className={cn(styles.empty, className)}
        {...props}
      >
        {children}
      </li>
    )
  }
)
ComboboxEmpty.displayName = "ComboboxEmpty"

/* ─── ComboboxGroup ─────────────────────────────────────────────────── */

export interface ComboboxGroupProps extends React.HTMLAttributes<HTMLLIElement> {
  heading?: string
}

const ComboboxGroup = React.forwardRef<HTMLLIElement, ComboboxGroupProps>(
  ({ className, heading, children, ...props }, ref) => {
    return (
      <li ref={ref} data-slot="combobox-group" role="presentation" className={cn(styles.group, className)} {...props}>
        {heading && (
          <div data-slot="combobox-group-heading" className={styles.groupHeading} aria-hidden="true">
            {heading}
          </div>
        )}
        <ul role="group" aria-label={heading}>
          {children}
        </ul>
      </li>
    )
  }
)
ComboboxGroup.displayName = "ComboboxGroup"

/* ─── ComboboxSeparator ─────────────────────────────────────────────── */

export type ComboboxSeparatorProps = React.HTMLAttributes<HTMLLIElement>

const ComboboxSeparator = React.forwardRef<HTMLLIElement, ComboboxSeparatorProps>(
  ({ className, ...props }, ref) => {
    return (
      <li
        ref={ref}
        role="separator"
        data-slot="combobox-separator"
        className={cn(styles.separator, className)}
        {...props}
      />
    )
  }
)
ComboboxSeparator.displayName = "ComboboxSeparator"

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxSeparator,
}
