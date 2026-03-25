"use client"

import * as React from "react"
import { Eye, EyeSlash } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import { Input, type InputProps } from "../input/input"
import styles from "./password-input.module.css"

export interface PasswordInputProps extends Omit<InputProps, "type"> {
  showStrength?: boolean
}

function getPasswordStrength(value: string): {
  score: number
  label: string
} {
  let score = 0
  if (value.length >= 8) score++
  if (/[a-z]/.test(value)) score++
  if (/[A-Z]/.test(value)) score++
  if (/[0-9]/.test(value)) score++
  if (/[^a-zA-Z0-9]/.test(value)) score++

  const labels = ["", "weak", "fair", "good", "strong", "strong"]
  return { score: Math.min(score, 4), label: labels[score] }
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrength = false, value, defaultValue, onChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [internalValue, setInternalValue] = React.useState(
      String(defaultValue ?? "")
    )
    const isControlled = value !== undefined
    const currentValue = isControlled ? String(value) : internalValue

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalValue(e.target.value)
      }
      onChange?.(e)
    }

    const strength = showStrength ? getPasswordStrength(currentValue) : null

    return (
      <div data-slot="password-input" className={cn(styles.wrapper, className)}>
        <div className={styles.inputWrapper}>
          <Input
            ref={ref}
            type={showPassword ? "text" : "password"}
            value={currentValue}
            onChange={handleChange}
            className={styles.input}
            {...props}
          />
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeSlash aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
          </button>
        </div>
        {showStrength && currentValue.length > 0 && strength && (
          <div className={styles.strengthMeter} aria-live="polite">
            <div className={styles.strengthTrack}>
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    styles.strengthSegment,
                    i < strength.score && styles[`strength${strength.label.charAt(0).toUpperCase() + strength.label.slice(1)}` as keyof typeof styles]
                  )}
                />
              ))}
            </div>
            <span className={styles.strengthLabel}>{strength.label}</span>
          </div>
        )}
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput, getPasswordStrength }
