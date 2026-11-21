"use client"

import * as React from "react"
import {
  BellIcon,
  CaretUpDownIcon,
  CommandIcon,
  MoonIcon,
  QuestionIcon,
  SignOutIcon,
  UserCircleIcon,
} from "@phosphor-icons/react"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu/dropdown-menu"
import styles from "./profile-menu.module.css"

export type ProfileMenuStatus = "online" | "away" | "busy" | "offline"

const STATUS_LABEL: Record<ProfileMenuStatus, string> = {
  online: "Online",
  away: "Away",
  busy: "Busy",
  offline: "Offline",
}

export interface ProfileMenuUser {
  name: string
  email?: string
  avatarUrl?: string
  initials?: string
  status?: ProfileMenuStatus
}

export interface ProfileMenuContext {
  label: string
  icon?: React.ReactNode
}

export type ProfileMenuItem =
  | {
      type: "item"
      icon?: React.ReactNode
      label: string
      shortcut?: string
      badge?: React.ReactNode
      variant?: "default" | "destructive"
      onSelect?: () => void
    }
  | { type: "separator" }
  | { type: "label"; text: string }

export interface ProfileMenuProps {
  user: ProfileMenuUser
  context?: ProfileMenuContext
  items: ProfileMenuItem[]
  onSignOut?: () => void
  /** Register a window-level ⌘⇧Q / Ctrl+⇧+Q handler that calls onSignOut. Default false. */
  enableGlobalShortcuts?: boolean
  /**
   * The button that opens the menu. "row" (default): avatar, name, context and caret,
   * for a sidebar footer. "avatar": the round avatar alone, ringed in the key colour on
   * hover and while open, for a top bar; the menu header then shows the name and email,
   * and the menu renders in place so it reads a glass switch (`data-glass="on"`) around it.
   */
  trigger?: "row" | "avatar"
  /** Open direction. Default "top" for the row trigger (footer is bottom-anchored), "bottom" for the avatar. */
  side?: "top" | "bottom" | "auto"
  /** Open on first render (uncontrolled). */
  defaultOpen?: boolean
  className?: string
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return ((parts[0]![0] ?? "") + (parts[parts.length - 1]![0] ?? "")).toUpperCase()
}

export function ProfileMenu({
  user,
  context,
  items,
  onSignOut,
  enableGlobalShortcuts = false,
  trigger = "row",
  side = trigger === "avatar" ? "bottom" : "top",
  defaultOpen,
  className,
}: ProfileMenuProps) {
  const isAvatar = trigger === "avatar"
  // The avatar menu renders into this layer beside its trigger, not at the end of the page.
  const [layer, setLayer] = React.useState<HTMLSpanElement | null>(null)
  const initials = user.initials ?? deriveInitials(user.name)
  const triggerLabel = context?.label
    ? `Account menu · ${user.name} · ${context.label}`
    : `Account menu · ${user.name}`

  React.useEffect(() => {
    if (!enableGlobalShortcuts || !onSignOut) return
    function handler(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey
      if (mod && event.shiftKey && (event.key === "Q" || event.key === "q")) {
        event.preventDefault()
        onSignOut?.()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [enableGlobalShortcuts, onSignOut])

  const contentSide = side === "auto" ? undefined : side

  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={triggerLabel}
          data-slot="profile-menu-trigger"
          data-trigger={trigger}
          className={cn(isAvatar ? styles.avatarTrigger : styles.trigger, className)}
        >
          <span className={styles.triggerAvatarWrap}>
            <Avatar size={isAvatar ? "lg" : "default"} className={styles.triggerAvatar} aria-hidden="true">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt="" />
              ) : null}
              <AvatarFallback aria-hidden="true">{initials}</AvatarFallback>
            </Avatar>
            {user.status ? (
              <span
                className={styles.statusDot}
                data-status={user.status}
                role="img"
                aria-label={STATUS_LABEL[user.status]}
              />
            ) : null}
          </span>
          {isAvatar ? null : (
            <>
              <span
                className={styles.triggerIdentity}
                aria-hidden="true"
                data-admin-shell-label
              >
                <span className={styles.triggerName}>{user.name}</span>
                {context ? (
                  <span className={styles.triggerContext}>
                    {context.icon ? (
                      <span className={styles.triggerContextIcon} aria-hidden="true">
                        {context.icon}
                      </span>
                    ) : null}
                    <span className={styles.triggerContextLabel}>{context.label}</span>
                  </span>
                ) : null}
              </span>

              <CaretUpDownIcon
                size={14}
                weight="regular"
                aria-hidden="true"
                className={styles.triggerCaret}
                data-admin-shell-label
              />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      {isAvatar ? <span ref={setLayer} data-slot="profile-menu-layer" /> : null}

      <DropdownMenuContent
        side={contentSide}
        align={isAvatar ? "end" : "start"}
        sideOffset={isAvatar ? 8 : 6}
        collisionPadding={isAvatar ? 16 : undefined}
        container={isAvatar ? layer : undefined}
        data-skin={isAvatar ? "popover" : undefined}
        className={cn(styles.content, isAvatar && styles.popoverSkin)}
      >
        {isAvatar ? (
          <DropdownMenuLabel className={cn(styles.menuHeader, styles.menuHeaderWho)}>
            <span className={styles.menuHeaderName}>{user.name}</span>
            {user.email ? <span className={styles.menuHeaderHint}>{user.email}</span> : null}
          </DropdownMenuLabel>
        ) : user.email ? (
          <DropdownMenuLabel className={styles.menuHeader}>
            <span className={styles.menuHeaderHint}>Signed in as</span>
            <span className={styles.menuHeaderEmail}>{user.email}</span>
          </DropdownMenuLabel>
        ) : null}

        {items.map((entry, index) => {
          if (entry.type === "separator") {
            return <DropdownMenuSeparator key={`sep-${index}`} />
          }
          if (entry.type === "label") {
            return (
              <DropdownMenuLabel key={`label-${index}`}>
                {entry.text}
              </DropdownMenuLabel>
            )
          }
          return (
            <DropdownMenuItem
              key={`item-${index}-${entry.label}`}
              variant={entry.variant ?? "default"}
              onSelect={entry.onSelect}
              className={styles.item}
              data-slot="profile-menu-item"
            >
              {entry.icon ? (
                <span className={styles.itemIcon} aria-hidden="true">
                  {entry.icon}
                </span>
              ) : null}
              <span className={styles.itemLabel}>{entry.label}</span>
              {entry.badge != null ? (
                <span className={styles.itemBadge} data-slot="profile-menu-item-badge">
                  {entry.badge}
                </span>
              ) : null}
              {entry.shortcut ? (
                <DropdownMenuShortcut className={styles.itemShortcut}>
                  {entry.shortcut}
                </DropdownMenuShortcut>
              ) : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export interface DefaultProfileMenuOptions {
  onSignOut?: () => void
  notificationCount?: number
}

export function defaultProfileMenuItems(
  user: ProfileMenuUser,
  opts: DefaultProfileMenuOptions = {}
): ProfileMenuItem[] {
  void user
  const items: ProfileMenuItem[] = [
    {
      type: "item",
      icon: <UserCircleIcon size={16} weight="regular" />,
      label: "Account settings",
    },
    {
      type: "item",
      icon: <BellIcon size={16} weight="regular" />,
      label: "Notifications",
      badge:
        typeof opts.notificationCount === "number" && opts.notificationCount > 0
          ? opts.notificationCount
          : undefined,
    },
    {
      type: "item",
      icon: <MoonIcon size={16} weight="regular" />,
      label: "Appearance",
    },
    {
      type: "item",
      icon: <CommandIcon size={16} weight="regular" />,
      label: "Keyboard shortcuts",
      shortcut: "⌘/",
    },
    {
      type: "item",
      icon: <QuestionIcon size={16} weight="regular" />,
      label: "Help & docs",
    },
    { type: "separator" },
    {
      type: "item",
      icon: <SignOutIcon size={16} weight="regular" />,
      label: "Sign out",
      shortcut: "⌘⇧Q",
      variant: "destructive",
      onSelect: opts.onSignOut,
    },
  ]
  return items
}
