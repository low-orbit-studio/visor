"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { CheckIcon, CircleIcon } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./radio-group.module.css"

export type RadioGroupVariant = "default" | "card"

export interface RadioGroupProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  /**
   * `default` draws a dot beside a label. `card` draws each item as a card with
   * an icon, a title and a one-line description.
   */
  variant?: RadioGroupVariant
}

const RadioGroupVariantContext = React.createContext<RadioGroupVariant>("default")

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, variant = "default", ...props }, ref) => {
  return (
    <RadioGroupVariantContext.Provider value={variant}>
      <RadioGroupPrimitive.Root
        data-slot="radio-group"
        data-variant={variant}
        className={cn(styles.root, variant === "card" && styles.rootCard, className)}
        ref={ref}
        {...props}
      />
    </RadioGroupVariantContext.Provider>
  )
})
RadioGroup.displayName = "RadioGroup"

export interface RadioGroupItemProps
  extends Omit<React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>, "title"> {
  /** Card variant: leading icon or swatch. Decorative, hidden from assistive tech. */
  icon?: React.ReactNode
  /** Card variant: the option's name. It is the item's accessible name. */
  title?: React.ReactNode
  /** Card variant: one line saying what the option means. It describes the item. */
  description?: React.ReactNode
}

function joinIds(...ids: Array<string | undefined>): string | undefined {
  const joined = ids.filter(Boolean).join(" ")
  return joined || undefined
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, icon, title, description, children, ...props }, ref) => {
  const variant = React.useContext(RadioGroupVariantContext)
  const uid = React.useId()
  const titleId = `${uid}-title`
  const descriptionId = `${uid}-description`

  if (variant === "card") {
    const hasTitle = title !== undefined && title !== null
    const hasDescription = description !== undefined && description !== null
    const {
      "aria-describedby": describedBy,
      "aria-labelledby": labelledBy,
      ...rest
    } = props
    return (
      <RadioGroupPrimitive.Item
        data-slot="radio-group-item"
        className={cn(styles.card, className)}
        aria-labelledby={labelledBy ?? (hasTitle ? titleId : undefined)}
        aria-describedby={joinIds(hasDescription ? descriptionId : undefined, describedBy)}
        ref={ref}
        {...rest}
      >
        {icon ? (
          <span data-slot="radio-group-card-icon" className={styles.cardIcon} aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className={styles.cardText}>
          {hasTitle ? (
            <span id={titleId} data-slot="radio-group-card-title" className={styles.cardTitle}>
              {title}
            </span>
          ) : null}
          {hasDescription ? (
            <span
              id={descriptionId}
              data-slot="radio-group-card-description"
              className={styles.cardDescription}
            >
              {description}
            </span>
          ) : null}
          {children}
        </span>
        <span className={styles.cardMark} aria-hidden="true">
          <RadioGroupPrimitive.Indicator
            data-slot="radio-group-indicator"
            className={styles.cardIndicator}
          >
            <CheckIcon weight="bold" className={styles.cardCheck} />
          </RadioGroupPrimitive.Indicator>
        </span>
      </RadioGroupPrimitive.Item>
    )
  }

  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(styles.item, className)}
      ref={ref}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className={styles.indicator}
      >
        <CircleIcon weight="fill" className={styles.icon} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
