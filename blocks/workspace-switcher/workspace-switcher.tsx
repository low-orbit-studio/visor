"use client"

import * as React from "react"
import { CaretUpDownIcon, CheckIcon } from "@phosphor-icons/react"
import { cn } from "../../lib/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu/dropdown-menu"
import styles from "./workspace-switcher.module.css"

export interface WorkspaceItem {
  /** Stable id passed to onSelect. */
  id: string
  /** Display name. Single line in trigger; single line + ellipsis in menu. */
  name: string
  /** Secondary line — plan + region, role, etc. Optional. CSS-truncated. */
  plan?: string
  /** Required. Used for AvatarFallback. Caller controls derivation rules. */
  initials: string
  /** Optional org logo. Rendered via AvatarImage; falls back to initials. */
  imageUrl?: string
}

export interface WorkspaceSwitcherProps {
  /** The currently active workspace. Fully controlled by the parent. */
  current: WorkspaceItem
  /** All workspaces available to the user (may include `current`; may be empty). */
  workspaces: WorkspaceItem[]
  /** Fires when a workspace item is activated (click or keyboard). */
  onSelect: (id: string) => void
  /** Trigger presentation. "full" = avatar+name+plan+caret. "compact" = avatar+caret. Default "full". */
  trigger?: "full" | "compact"
  /** Forwarded to the trigger button's root. */
  className?: string
}

export function WorkspaceSwitcher({
  current,
  workspaces,
  onSelect,
  trigger = "full",
  className,
}: WorkspaceSwitcherProps) {
  // Other workspaces are all workspaces except the current one
  const otherWorkspaces = workspaces.filter((w) => w.id !== current.id)
  const hasOthers = otherWorkspaces.length > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Switch workspace · current: ${current.name}`}
          data-trigger={trigger}
          data-slot="workspace-switcher-trigger"
          className={cn(
            styles.trigger,
            trigger === "compact" && styles.triggerCompact,
            className
          )}
        >
          <Avatar size="sm" className={styles.triggerAvatar} aria-hidden="true">
            {current.imageUrl ? (
              <AvatarImage src={current.imageUrl} alt="" />
            ) : null}
            <AvatarFallback aria-hidden="true">{current.initials}</AvatarFallback>
          </Avatar>
          {trigger === "full" ? (
            <span className={styles.triggerText} aria-hidden="true">
              <span className={styles.triggerName}>{current.name}</span>
              {current.plan ? (
                <span className={styles.triggerPlan}>{current.plan}</span>
              ) : null}
            </span>
          ) : null}
          <CaretUpDownIcon
            size={12}
            weight="regular"
            aria-hidden="true"
            className={styles.triggerCaret}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className={styles.content}>
        {/* Current workspace — always shown first with check indicator */}
        <DropdownMenuItem
          onSelect={() => onSelect(current.id)}
          className={styles.item}
          data-slot="workspace-switcher-item"
          data-current="true"
        >
          <Avatar size="sm" className={styles.itemAvatar} aria-hidden="true">
            {current.imageUrl ? (
              <AvatarImage src={current.imageUrl} alt="" />
            ) : null}
            <AvatarFallback aria-hidden="true">{current.initials}</AvatarFallback>
          </Avatar>
          <span className={styles.itemText}>
            <span className={styles.itemName}>{current.name}</span>
            {current.plan ? (
              <span className={styles.itemPlan}>{current.plan}</span>
            ) : null}
          </span>
          <CheckIcon
            size={14}
            weight="regular"
            aria-hidden="true"
            className={styles.itemCheck}
          />
        </DropdownMenuItem>

        {/* Other workspaces or empty state */}
        {hasOthers ? (
          otherWorkspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onSelect={() => onSelect(workspace.id)}
              className={styles.item}
              data-slot="workspace-switcher-item"
            >
              <Avatar size="sm" className={styles.itemAvatar} aria-hidden="true">
                {workspace.imageUrl ? (
                  <AvatarImage src={workspace.imageUrl} alt="" />
                ) : null}
                <AvatarFallback aria-hidden="true">{workspace.initials}</AvatarFallback>
              </Avatar>
              <span className={styles.itemText}>
                <span className={styles.itemName}>{workspace.name}</span>
                {workspace.plan ? (
                  <span className={styles.itemPlan}>{workspace.plan}</span>
                ) : null}
              </span>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem
            disabled
            className={cn(styles.item, styles.emptyItem)}
            data-slot="workspace-switcher-empty"
          >
            No other workspaces
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
