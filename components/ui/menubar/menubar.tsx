"use client"

import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { CheckIcon, CaretRightIcon } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./menubar.module.css"

function Menubar({ className, ...props }: React.ComponentProps<typeof MenubarPrimitive.Root>) {
  return (
    <MenubarPrimitive.Root
      data-slot="menubar"
      className={cn(styles.root, className)}
      {...props}
    />
  )
}
Menubar.displayName = "Menubar"

function MenubarMenu({ ...props }: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />
}
MenubarMenu.displayName = "MenubarMenu"

const MenubarTrigger = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentProps<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    data-slot="menubar-trigger"
    className={cn(styles.trigger, className)}
    {...props}
  />
))
MenubarTrigger.displayName = "MenubarTrigger"

const MenubarContent = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Content>,
  React.ComponentProps<typeof MenubarPrimitive.Content>
>(({ className, align = "start", sideOffset = 4, ...props }, ref) => (
  <MenubarPrimitive.Portal>
    <MenubarPrimitive.Content
      ref={ref}
      data-slot="menubar-content"
      align={align}
      sideOffset={sideOffset}
      className={cn(styles.content, className)}
      {...props}
    />
  </MenubarPrimitive.Portal>
))
MenubarContent.displayName = "MenubarContent"

function MenubarGroup({ ...props }: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group data-slot="menubar-group" {...props} />
}
MenubarGroup.displayName = "MenubarGroup"

export interface MenubarItemProps
  extends React.ComponentProps<typeof MenubarPrimitive.Item> {
  inset?: boolean
  variant?: "default" | "destructive"
}

const MenubarItem = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Item>,
  MenubarItemProps
>(({ className, inset, variant = "default", ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    data-slot="menubar-item"
    data-inset={inset}
    data-variant={variant}
    className={cn(
      styles.item,
      variant === "destructive" && styles.itemDestructive,
      inset && styles.itemInset,
      className
    )}
    {...props}
  />
))
MenubarItem.displayName = "MenubarItem"

const MenubarCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentProps<typeof MenubarPrimitive.CheckboxItem> & { inset?: boolean }
>(({ className, children, checked, inset, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    data-slot="menubar-checkbox-item"
    data-inset={inset}
    className={cn(styles.checkboxItem, inset && styles.itemInset, className)}
    checked={checked}
    {...props}
  >
    <span className={styles.itemIndicator} data-slot="menubar-checkbox-item-indicator">
      <MenubarPrimitive.ItemIndicator>
        <CheckIcon />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
))
MenubarCheckboxItem.displayName = "MenubarCheckboxItem"

function MenubarRadioGroup({ ...props }: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />
}
MenubarRadioGroup.displayName = "MenubarRadioGroup"

const MenubarRadioItem = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentProps<typeof MenubarPrimitive.RadioItem> & { inset?: boolean }
>(({ className, children, inset, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    data-slot="menubar-radio-item"
    data-inset={inset}
    className={cn(styles.radioItem, inset && styles.itemInset, className)}
    {...props}
  >
    <span className={styles.itemIndicator} data-slot="menubar-radio-item-indicator">
      <MenubarPrimitive.ItemIndicator>
        <CheckIcon />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
))
MenubarRadioItem.displayName = "MenubarRadioItem"

const MenubarLabel = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Label>,
  React.ComponentProps<typeof MenubarPrimitive.Label> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    data-slot="menubar-label"
    data-inset={inset}
    className={cn(styles.label, inset && styles.itemInset, className)}
    {...props}
  />
))
MenubarLabel.displayName = "MenubarLabel"

const MenubarSeparator = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.Separator>,
  React.ComponentProps<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    data-slot="menubar-separator"
    className={cn(styles.separator, className)}
    {...props}
  />
))
MenubarSeparator.displayName = "MenubarSeparator"

function MenubarShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="menubar-shortcut"
      className={cn(styles.shortcut, className)}
      {...props}
    />
  )
}
MenubarShortcut.displayName = "MenubarShortcut"

function MenubarSub({ ...props }: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}
MenubarSub.displayName = "MenubarSub"

const MenubarSubTrigger = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentProps<typeof MenubarPrimitive.SubTrigger> & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    data-slot="menubar-sub-trigger"
    data-inset={inset}
    className={cn(styles.subTrigger, inset && styles.itemInset, className)}
    {...props}
  >
    {children}
    <CaretRightIcon className={styles.subTriggerIcon} />
  </MenubarPrimitive.SubTrigger>
))
MenubarSubTrigger.displayName = "MenubarSubTrigger"

const MenubarSubContent = React.forwardRef<
  React.ComponentRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentProps<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    data-slot="menubar-sub-content"
    className={cn(styles.subContent, className)}
    {...props}
  />
))
MenubarSubContent.displayName = "MenubarSubContent"

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
}
