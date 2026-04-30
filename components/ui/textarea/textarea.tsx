import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import { usePasswordManagersValue } from "../../../lib/password-managers-context"
import styles from "./textarea.module.css"

const textareaVariants = cva(styles.base, {
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

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
    VariantProps<typeof textareaVariants> {
  /**
   * Whether password managers (1Password, Bitwarden, LastPass) should
   * offer to autofill this field. Defaults to `"ignore"` because most
   * Visor textareas live on non-auth forms (contact, marketing, settings)
   * where autofill icons are visual noise. Set to `"allow"` on the rare
   * credential or notes-style field where autofill is desired, or wrap the
   * form in `<Form passwordManagers="allow">` to opt every descendant field
   * in at once. The field-level prop always wins over the form context.
   * Browsers ignore `autocomplete="off"` on individual fields, so `"ignore"`
   * emits the per-manager data-* attributes (`data-1p-ignore`, `data-bwignore`,
   * `data-lpignore`, `data-form-type="other"`) that each manager respects.
   */
  passwordManagers?: "ignore" | "allow"
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size, passwordManagers, ...props }, ref) => {
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
    return (
      <textarea
        data-slot="textarea"
        className={cn(textareaVariants({ size }), className)}
        ref={ref}
        {...ignoreAttrs}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
