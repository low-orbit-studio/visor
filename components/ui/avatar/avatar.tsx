"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "../../../lib/utils"
import styles from "./avatar.module.css"
import stackStyles from "./avatar-stack.module.css"

// ─── AvatarStack item type ───────────────────────────────────────────────────

/**
 * Rich item form for AvatarStack. A plain string or `undefined` is also
 * accepted (backward-compatible shorthand for an image-src-only item).
 */
export interface AvatarStackItem {
  /** Initials rendered as fallback (and primary) content — e.g. "AR". */
  initials?: React.ReactNode
  /** Optional image source. When present, the image covers the disc. */
  src?: string
  /** Accessible label for the disc — e.g. the member name. */
  alt?: string
  /**
   * Per-avatar style escape hatch — carries the gradient `background` + text
   * `color` for the editorial gradient discs (see `getMemberAvatarStyle`).
   */
  style?: React.CSSProperties
}

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  size?: "sm" | "default" | "lg"
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size = "default", ...props }, ref) => {
  return (
    <AvatarPrimitive.Root
      ref={ref}
      data-slot="avatar"
      data-size={size}
      className={cn(
        styles.avatar,
        size === "sm" && styles.avatarSm,
        size === "lg" && styles.avatarLg,
        className
      )}
      {...props}
    />
  )
})
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      data-slot="avatar-image"
      className={cn(styles.avatarImage, className)}
      {...props}
    />
  )
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      data-slot="avatar-fallback"
      className={cn(styles.avatarFallback, className)}
      {...props}
    />
  )
})
AvatarFallback.displayName = "AvatarFallback"

export interface AvatarStackProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "role" | "aria-label"> {
  /**
   * Avatars to render, in display order. Each entry is either:
   * - A plain image URL string (backward-compatible shorthand)
   * - `undefined` — renders the `·` fallback disc, useful for server-truncated lists
   * - An `AvatarStackItem` object with `initials`, `src`, `alt`, and/or `style`
   */
  avatars: (string | undefined | AvatarStackItem)[]
  /**
   * Total member count. May exceed `avatars.length` when the caller has
   * server-truncated the avatar URLs and only knows the count. The overflow
   * indicator is computed against this value.
   */
  total: number
  /**
   * Maximum number of avatar slots rendered before the `+N` overflow
   * indicator. Defaults to `6`.
   */
  max?: number
  /**
   * Explicit "+N" override. When provided, this value is used verbatim
   * instead of the value derived from `total - visible.length`. Useful
   * when the caller has a pre-computed overflow count.
   */
  overflowCount?: number
  /** Avatar size. Defaults to `"sm"`. */
  size?: "sm" | "default" | "lg"
  /**
   * Accessible label override. Defaults to ``${total} members``.
   */
  label?: string
}

/** Normalize a raw avatar entry to an `AvatarStackItem`. */
function toItem(entry: string | undefined | AvatarStackItem): AvatarStackItem {
  if (entry === undefined || entry === null) return {}
  if (typeof entry === "string") return { src: entry, alt: "" }
  return entry
}

const AvatarStack = React.forwardRef<HTMLDivElement, AvatarStackProps>(
  function AvatarStack(
    {
      avatars,
      total,
      max = 6,
      overflowCount,
      size = "sm",
      label,
      className,
      ...rest
    },
    ref,
  ) {
    const visible = avatars.slice(0, max)
    const derivedOverflow = Math.max(0, total - visible.length)
    const overflow = overflowCount ?? derivedOverflow
    const ariaLabel = label ?? `${total} members`

    return (
      <div
        ref={ref}
        role="img"
        aria-label={ariaLabel}
        data-slot="avatar-stack"
        data-size={size}
        className={cn(stackStyles.root, className)}
        {...rest}
      >
        {visible.map((entry, index) => {
          const item = toItem(entry)
          return (
            <Avatar
              key={index}
              size={size}
              className={stackStyles.avatar}
              style={item.style}
              data-stack-item=""
            >
              {item.src ? (
                <AvatarImage src={item.src} alt={item.alt ?? ""} />
              ) : item.initials != null ? (
                <AvatarFallback className={stackStyles.initialsDisc}>
                  {item.initials}
                </AvatarFallback>
              ) : (
                <AvatarFallback>·</AvatarFallback>
              )}
            </Avatar>
          )
        })}
        {overflow > 0 ? (
          <Avatar
            size={size}
            className={stackStyles.avatar}
            data-stack-overflow=""
          >
            <AvatarFallback>+{overflow}</AvatarFallback>
          </Avatar>
        ) : null}
      </div>
    )
  },
)

AvatarStack.displayName = "AvatarStack"

export { Avatar, AvatarImage, AvatarFallback, AvatarStack }
