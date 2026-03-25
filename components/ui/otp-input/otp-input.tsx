"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./otp-input.module.css"

export interface OTPInputProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  length?: number
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
}

const OTPInput = React.forwardRef<HTMLDivElement, OTPInputProps>(
  (
    {
      className,
      length = 6,
      value,
      onChange,
      disabled = false,
      autoFocus = false,
      ...props
    },
    ref
  ) => {
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])
    const [internalValue, setInternalValue] = React.useState("")
    const isControlled = value !== undefined
    const currentValue = isControlled ? value : internalValue

    const digits = currentValue.split("").slice(0, length)

    const updateValue = (newValue: string) => {
      const cleaned = newValue.replace(/\D/g, "").slice(0, length)
      if (!isControlled) {
        setInternalValue(cleaned)
      }
      onChange?.(cleaned)
    }

    const focusInput = (index: number) => {
      const clamped = Math.max(0, Math.min(index, length - 1))
      inputRefs.current[clamped]?.focus()
    }

    const handleInput = (index: number, char: string) => {
      const newDigits = [...digits]
      while (newDigits.length < length) newDigits.push("")
      newDigits[index] = char
      const newValue = newDigits.join("")
      updateValue(newValue)
      if (char && index < length - 1) {
        focusInput(index + 1)
      }
    }

    const handleKeyDown = (
      index: number,
      e: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (e.key === "Backspace") {
        e.preventDefault()
        if (digits[index]) {
          handleInput(index, "")
        } else if (index > 0) {
          handleInput(index - 1, "")
          focusInput(index - 1)
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault()
        focusInput(index - 1)
      } else if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault()
        focusInput(index + 1)
      }
    }

    const handleChange = (
      index: number,
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const char = e.target.value.replace(/\D/g, "").slice(-1)
      if (char) {
        handleInput(index, char)
      }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const pastedDigits = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, length)
      if (pastedDigits) {
        updateValue(pastedDigits)
        focusInput(Math.min(pastedDigits.length, length - 1))
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select()
    }

    return (
      <div
        ref={ref}
        data-slot="otp-input"
        role="group"
        aria-label="Verification code"
        className={cn(styles.wrapper, className)}
        {...props}
      >
        {Array.from({ length }, (_, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]"
            maxLength={1}
            value={digits[i] ?? ""}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={handleFocus}
            disabled={disabled}
            autoFocus={autoFocus && i === 0}
            aria-label={`Digit ${i + 1} of ${length}`}
            className={cn(
              styles.cell,
              digits[i] && styles.cellFilled
            )}
          />
        ))}
      </div>
    )
  }
)
OTPInput.displayName = "OTPInput"

export { OTPInput }
