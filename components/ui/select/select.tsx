"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CaretDownIcon, CaretUpIcon, CheckIcon } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./select.module.css"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: "sm" | "md" | "lg"
  }
>(({ className, size = "md", children, ...props }, ref) => {
  const sizeClass = {
    sm: styles.triggerSizeSm,
    md: styles.triggerSizeMd,
    lg: styles.triggerSizeLg,
  }[size]

  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        styles.trigger,
        sizeClass,
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <CaretDownIcon className={styles.triggerIcon} />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(styles.content, className)}
        position={position}
        ref={ref}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            styles.viewport,
            position === "popper" && styles.viewportPopper
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(styles.label, className)}
      ref={ref}
      {...props}
    />
  )
})
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(styles.item, className)}
      ref={ref}
      {...props}
    >
      <span className={styles.itemIndicatorWrapper}>
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className={styles.itemIndicatorIcon} />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(styles.separator, className)}
      ref={ref}
      {...props}
    />
  )
})
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(styles.scrollButton, className)}
      ref={ref}
      {...props}
    >
      <CaretUpIcon className={styles.scrollButtonIcon} />
    </SelectPrimitive.ScrollUpButton>
  )
})
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(styles.scrollButton, className)}
      ref={ref}
      {...props}
    >
      <CaretDownIcon className={styles.scrollButtonIcon} />
    </SelectPrimitive.ScrollDownButton>
  )
})
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
