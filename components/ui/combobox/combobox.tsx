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
}

const ComboboxContext = React.createContext<ComboboxContextValue | undefined>(undefined)

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
  ({ className, onChange, onFocus, onClick, placeholder = "Search...", ...props }, ref) => {
    const { inputValue, setInputValue, setOpen, open, listboxId } = useComboboxContext()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
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
            aria-haspopup="listbox"
            autoComplete="off"
            value={inputValue}
            placeholder={placeholder}
            className={cn(styles.input, className)}
            onChange={handleChange}
            onFocus={handleFocus}
            onClick={handleClick}
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
  ({ className, value, label, children, disabled, onClick, ...props }, ref) => {
    const { selectedValue, onSelect } = useComboboxContext()
    const isSelected = selectedValue === value
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
        role="option"
        aria-selected={isSelected}
        data-slot="combobox-item"
        data-selected={isSelected ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        className={cn(styles.item, className)}
        onClick={handleClick}
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
