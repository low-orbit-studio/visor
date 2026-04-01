"use client"

import * as React from "react"
import {
  useForm,
  getFormProps,
  type FormMetadata,
} from "@conform-to/react"
import { parseWithZod } from "@conform-to/zod"
import type { z } from "zod"
import { cn } from "../../../lib/utils"
import styles from "./form.module.css"

/* ─── Types ────────────────────────────────────────────────────────── */

export interface FormProps<Schema extends z.ZodType>
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "action"> {
  /** Zod schema for validation */
  schema: Schema
  /** Server action function */
  action: (prevState: unknown, formData: FormData) => Promise<unknown>
  /** Called with form and fields metadata for rendering */
  children: (context: {
    form: FormMetadata<z.infer<Schema>>
    fields: ReturnType<FormMetadata<z.infer<Schema>>["getFieldset"]>
  }) => React.ReactNode
  /** Default values for form fields */
  defaultValue?: Partial<z.infer<Schema>>
  /** When to validate: "onSubmit" | "onBlur" | "onInput" */
  shouldValidate?: "onSubmit" | "onBlur" | "onInput"
}

/* ─── Form ─────────────────────────────────────────────────────────── */

function Form<Schema extends z.ZodType>({
  schema,
  action,
  children,
  defaultValue,
  shouldValidate = "onBlur",
  className,
  ...props
}: FormProps<Schema>) {
  const [lastResult, formAction] = React.useActionState(action, null)

  const [form, fields] = useForm({
    lastResult,
    defaultValue,
    shouldValidate,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    },
  })

  return (
    <form
      {...getFormProps(form)}
      action={formAction}
      className={cn(styles.form, className)}
      noValidate
      {...props}
    >
      {children({ form, fields })}
    </form>
  )
}

export { Form }
