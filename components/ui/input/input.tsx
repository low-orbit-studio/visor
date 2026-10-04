import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import { usePasswordManagersValue } from "../../../lib/password-managers-context"
import styles from "./input.module.css"

const inputVariants = cva(styles.base, {
  variants: {
    size: {
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
    },
  },
  defaultVariants: {
    size: "md",
  },
})

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix">,
    VariantProps<typeof inputVariants> {
  /**
   * Optional leading icon rendered inside the field (e.g. a Phosphor icon).
   * The input picks up extra left padding so its text clears the icon. The
   * icon itself is `aria-hidden` — the field still needs its own label.
   */
  leadingIcon?: React.ReactNode
  /**
   * Fixed text drawn inside the field, before the value (a currency symbol,
   * for example). It sits in the same well as the value, in the secondary text
   * colour, and is never part of the value or the selection. Clicking it focuses
   * the input. It is wired to the input with `aria-describedby`, so assistive
   * tech reads it as a description of the field, not as its value.
   *
   * Replaces the native `prefix` HTML attribute (an RDFa vocabulary hook that
   * is never useful on an `<input>`); that attribute is not forwarded.
   */
  prefix?: React.ReactNode
  /** Fixed text drawn inside the field, after the value (`.epk.pro`, `h`). See `prefix`. */
  suffix?: React.ReactNode
  /**
   * Whether password managers (1Password, Bitwarden, LastPass) should
   * offer to autofill this field. Defaults to `"ignore"` because most
   * Visor inputs live on non-auth forms (contact, marketing, settings)
   * where autofill icons are visual noise. Set to `"allow"` on login
   * and credential fields, or wrap the form in `<Form passwordManagers="allow">`
   * to opt every descendant input in at once. The field-level prop always
   * wins over the form context. Browsers ignore `autocomplete="off"` on
   * individual inputs, so `"ignore"` emits the per-manager data-*
   * attributes (`data-1p-ignore`, `data-bwignore`, `data-lpignore`,
   * `data-form-type="other"`) that each manager respects.
   */
  passwordManagers?: "ignore" | "allow"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      size,
      leadingIcon,
      prefix,
      suffix,
      passwordManagers,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) ref.current = node
      },
      [ref]
    )
    const affixId = React.useId()
    const resolved = usePasswordManagersValue(passwordManagers)
    const ignoreAttrs =
      resolved === "ignore"
        ? {
            "data-1p-ignore": "true",
            "data-bwignore": "true",
            "data-lpignore": "true",
            "data-form-type": "other",
          }
        : null
    const hasPrefix = prefix !== undefined && prefix !== null && prefix !== false
    const hasSuffix = suffix !== undefined && suffix !== null && suffix !== false
    const hasAffix = hasPrefix || hasSuffix

    if (hasAffix) {
      const prefixId = `${affixId}-prefix`
      const suffixId = `${affixId}-suffix`
      const describedBy =
        [props["aria-describedby"], hasPrefix && prefixId, hasSuffix && suffixId]
          .filter(Boolean)
          .join(" ") || undefined
      // The well belongs to the wrapper: it draws the one edge, ground and
      // focus ring around the affix and the value together. The input inside
      // is bare. A press on the affix would blur the input, so it is handed
      // back to the input instead (and the click then lands on the field).
      const focusInput = (e: React.MouseEvent) => {
        if (e.target === inputRef.current) return
        e.preventDefault()
        inputRef.current?.focus()
      }
      return (
        <span
          className={cn(
            styles.affixWrapper,
            size === "sm" && styles.affixSm,
            size === "lg" && styles.affixLg,
            className
          )}
          data-slot="input-wrapper"
          data-size={size ?? "md"}
          onMouseDown={focusInput}
        >
          {leadingIcon ? (
            <span className={styles.affixIcon} aria-hidden="true">
              {leadingIcon}
            </span>
          ) : null}
          {hasPrefix ? (
            <span id={prefixId} className={styles.affix} data-slot="input-prefix">
              {prefix}
            </span>
          ) : null}
          <input
            type={type}
            data-slot="input"
            className={cn(
              styles.bare,
              size === "sm" ? styles.sizeSm : size === "lg" ? styles.sizeLg : styles.sizeMd,
              hasPrefix && styles.afterPrefix,
              hasSuffix && styles.beforeSuffix
            )}
            ref={setRefs}
            {...ignoreAttrs}
            {...props}
            aria-describedby={describedBy}
          />
          {hasSuffix ? (
            <span id={suffixId} className={styles.affix} data-slot="input-suffix">
              {suffix}
            </span>
          ) : null}
        </span>
      )
    }

    const input = (
      <input
        type={type}
        data-slot="input"
        className={cn(
          inputVariants({ size }),
          leadingIcon && styles.hasLeadingIcon,
          className
        )}
        ref={setRefs}
        {...ignoreAttrs}
        {...props}
      />
    )

    if (!leadingIcon) return input

    return (
      <span className={styles.leadingIconWrapper} data-slot="input-wrapper">
        <span className={styles.leadingIcon} aria-hidden="true">
          {leadingIcon}
        </span>
        {input}
      </span>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
