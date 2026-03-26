"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./fullscreen-overlay.module.css"

export interface FullscreenOverlayProps {
  /** Controlled open state */
  open?: boolean
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

function FullscreenOverlay({
  open,
  onOpenChange,
  children,
}: FullscreenOverlayProps) {
  return (
    <DialogPrimitive.Root
      data-slot="fullscreen-overlay"
      open={open}
      onOpenChange={onOpenChange}
    >
      {children}
    </DialogPrimitive.Root>
  )
}
FullscreenOverlay.displayName = "FullscreenOverlay"

function FullscreenOverlayTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return (
    <DialogPrimitive.Trigger
      data-slot="fullscreen-overlay-trigger"
      {...props}
    />
  )
}
FullscreenOverlayTrigger.displayName = "FullscreenOverlayTrigger"

const FullscreenOverlayContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentProps<typeof DialogPrimitive.Content> & {
    className?: string
  }
>(({ className, children, ...props }, ref) => {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={styles.overlay} />
      <DialogPrimitive.Content
        ref={ref}
        data-slot="fullscreen-overlay-content"
        className={cn(styles.content, className)}
        aria-label="Fullscreen view"
        {...props}
      >
        <DialogPrimitive.Title className={styles.srOnly}>
          Fullscreen view
        </DialogPrimitive.Title>
        <DialogPrimitive.Description className={styles.srOnly}>
          Press Escape or click the close button to dismiss
        </DialogPrimitive.Description>

        <DialogPrimitive.Close
          data-slot="fullscreen-overlay-close"
          className={styles.close}
        >
          <X weight="bold" />
          <span className={styles.srOnly}>Close</span>
        </DialogPrimitive.Close>

        <div className={styles.inner}>{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})
FullscreenOverlayContent.displayName = "FullscreenOverlayContent"

export {
  FullscreenOverlay,
  FullscreenOverlayTrigger,
  FullscreenOverlayContent,
}
