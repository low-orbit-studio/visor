"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "../../../lib/utils"
import styles from "./avatar.module.css"
import stackStyles from "./avatar-stack.module.css"

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
   * Avatar image sources to render, in display order. `undefined` entries
   * render with the `·` fallback so server-truncated lists still occupy a
   * slot.
   */
  avatars: (string | undefined)[]
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
  /** Avatar size. Defaults to `"sm"`. */
  size?: "sm" | "default" | "lg"
  /**
   * Accessible label override. Defaults to ``${total} members``.
   */
  label?: string
}

const AvatarStack = React.forwardRef<HTMLDivElement, AvatarStackProps>(
  function AvatarStack(
    {
      avatars,
      total,
      max = 6,
      size = "sm",
      label,
      className,
      ...rest
    },
    ref,
  ) {
    const visible = avatars.slice(0, max)
    const overflow = Math.max(0, total - visible.length)
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
        {visible.map((src, index) => (
          <Avatar
            key={index}
            size={size}
            className={stackStyles.avatar}
            data-stack-item=""
          >
            {src ? (
              <AvatarImage src={src} alt="" />
            ) : (
              <AvatarFallback>·</AvatarFallback>
            )}
          </Avatar>
        ))}
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
