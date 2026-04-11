"use client"

import * as React from "react"
import { MagnifyingGlass, X } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import { Input, type InputProps } from "../input/input"
import styles from "./search-input.module.css"

export interface SearchInputProps extends Omit<InputProps, "type"> {
  onClear?: () => void
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, defaultValue, onChange, onClear, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(
      defaultValue ?? ""
    )
    const isControlled = value !== undefined
    const currentValue = isControlled ? value : internalValue

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalValue(e.target.value)
      }
      onChange?.(e)
    }

    const handleClear = () => {
      if (!isControlled) {
        setInternalValue("")
      }
      onClear?.()
    }

    const showClear = String(currentValue).length > 0

    return (
      <div data-slot="search-input" className={cn(styles.wrapper, className)}>
        <Input
          ref={ref}
          type="search"
          value={currentValue}
          onChange={handleChange}
          leadingIcon={<MagnifyingGlass weight="bold" />}
          className={cn(showClear && styles.inputWithClear)}
          {...props}
        />
        {showClear && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X aria-hidden="true" />
          </button>
        )}
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }
