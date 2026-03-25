"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import { Input, type InputProps } from "../input/input"
import styles from "./phone-input.module.css"

export interface PhoneInputProps extends Omit<InputProps, "type" | "onChange"> {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
}

function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 10)
  if (d.length === 0) return ""
  if (d.length <= 3) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

function extractDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10)
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, defaultValue, onChange, ...props }, ref) => {
    const [internalDigits, setInternalDigits] = React.useState(
      extractDigits(String(defaultValue ?? ""))
    )
    const isControlled = value !== undefined
    const digits = isControlled ? extractDigits(String(value)) : internalDigits

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDigits = extractDigits(e.target.value)
      if (!isControlled) {
        setInternalDigits(newDigits)
      }
      onChange?.(newDigits)
    }

    return (
      <div data-slot="phone-input" className={cn(styles.wrapper, className)}>
        <Input
          ref={ref}
          type="tel"
          inputMode="tel"
          value={formatPhone(digits)}
          onChange={handleChange}
          className={styles.input}
          {...props}
        />
      </div>
    )
  }
)
PhoneInput.displayName = "PhoneInput"

export { PhoneInput, formatPhone }
