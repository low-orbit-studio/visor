"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "../dialog/dialog"
import styles from "./command.module.css"

const Command = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive>,
  React.ComponentProps<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    data-slot="command"
    className={cn(styles.root, className)}
    {...props}
  />
))
Command.displayName = "Command"

function CommandDialog({
  children,
  ...props
}: React.ComponentProps<typeof Dialog>) {
  return (
    <Dialog {...props}>
      <DialogContent className={styles.dialogContent}>
        <DialogTitle className={styles.srOnly}>Command Palette</DialogTitle>
        <Command className={styles.dialogCommand}>{children}</Command>
      </DialogContent>
    </Dialog>
  )
}
CommandDialog.displayName = "CommandDialog"

const CommandInput = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Input>,
  React.ComponentProps<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className={styles.inputWrapper} data-slot="command-input-wrapper">
    <MagnifyingGlassIcon className={styles.inputIcon} />
    <CommandPrimitive.Input
      ref={ref}
      data-slot="command-input"
      className={cn(styles.input, className)}
      {...props}
    />
  </div>
))
CommandInput.displayName = "CommandInput"

const CommandList = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.List>,
  React.ComponentProps<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    data-slot="command-list"
    className={cn(styles.list, className)}
    {...props}
  />
))
CommandList.displayName = "CommandList"

const CommandEmpty = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Empty>,
  React.ComponentProps<typeof CommandPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    data-slot="command-empty"
    className={cn(styles.empty, className)}
    {...props}
  />
))
CommandEmpty.displayName = "CommandEmpty"

const CommandGroup = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Group>,
  React.ComponentProps<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    data-slot="command-group"
    className={cn(styles.group, className)}
    {...props}
  />
))
CommandGroup.displayName = "CommandGroup"

const CommandItem = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Item>,
  React.ComponentProps<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    data-slot="command-item"
    className={cn(styles.item, className)}
    {...props}
  />
))
CommandItem.displayName = "CommandItem"

const CommandSeparator = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Separator>,
  React.ComponentProps<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    data-slot="command-separator"
    className={cn(styles.separator, className)}
    {...props}
  />
))
CommandSeparator.displayName = "CommandSeparator"

function CommandShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(styles.shortcut, className)}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

const CommandLoading = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Loading>,
  React.ComponentProps<typeof CommandPrimitive.Loading>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Loading
    ref={ref}
    data-slot="command-loading"
    className={cn(styles.loading, className)}
    {...props}
  />
))
CommandLoading.displayName = "CommandLoading"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
  CommandLoading,
}
