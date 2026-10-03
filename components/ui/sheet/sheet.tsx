"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { XIcon } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./sheet.module.css"

interface SheetContextValue {
  container: HTMLElement | null | undefined
  open: boolean
}

const SheetContext = React.createContext<SheetContextValue>({ container: undefined, open: false })

export interface SheetProps extends React.ComponentProps<typeof DialogPrimitive.Root> {
  /**
   * Element the overlay and content portal into, covering only that element.
   * A scoped sheet is not modal: it traps focus inside the panel and makes the
   * container's other children `inert`, but leaves everything outside the
   * container interactive (Radix modal mode would aria-hide the page and block
   * pointer events on `body`). Pass the element itself (hold it in state), not
   * a ref. The container is given `position: relative` if it is `static`.
   */
  container?: HTMLElement | null
}

function Sheet({ container, modal = true, open: openProp, defaultOpen = false, onOpenChange, ...props }: SheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = openProp ?? uncontrolledOpen
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [onOpenChange]
  )
  const value = React.useMemo(() => ({ container, open }), [container, open])
  return (
    <SheetContext.Provider value={value}>
      <DialogPrimitive.Root
        data-slot="sheet"
        modal={container ? false : modal}
        open={open}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </SheetContext.Provider>
  )
}
Sheet.displayName = "Sheet"

/**
 * Scoped sheets: make every other child of the container inert while open, and
 * make sure the container can anchor absolutely positioned content.
 */
function useScopedContainer(container: HTMLElement | null | undefined, node: HTMLElement | null) {
  React.useEffect(() => {
    if (!container || !node) return
    let branch: HTMLElement = node
    while (branch.parentElement && branch.parentElement !== container) {
      branch = branch.parentElement
    }
    if (branch.parentElement !== container) return

    const inerted: Element[] = []
    for (const child of Array.from(container.children)) {
      if (child !== branch && !child.hasAttribute("inert")) {
        child.setAttribute("inert", "")
        inerted.push(child)
      }
    }
    const anchored = getComputedStyle(container).position === "static"
    if (anchored) container.style.position = "relative"

    return () => {
      for (const child of inerted) child.removeAttribute("inert")
      if (anchored) container.style.position = ""
    }
  }, [container, node])
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}
SheetTrigger.displayName = "SheetTrigger"

function SheetClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}
SheetClose.displayName = "SheetClose"

function SheetPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}
SheetPortal.displayName = "SheetPortal"

const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentProps<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    data-slot="sheet-overlay"
    className={cn(styles.overlay, className)}
    {...props}
  />
))
SheetOverlay.displayName = "SheetOverlay"

const sheetContentVariants = cva(styles.content, {
  variants: {
    side: {
      top: styles.sideTop,
      right: styles.sideRight,
      bottom: styles.sideBottom,
      left: styles.sideLeft,
    },
  },
  defaultVariants: {
    side: "right",
  },
})

export interface SheetContentProps
  extends React.ComponentProps<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetContentVariants> {
  showCloseButton?: boolean
}

/** Backdrop for a scoped sheet. Radix renders no overlay outside modal mode. */
const SheetScrim = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    const { open } = React.useContext(SheetContext)
    return (
      <div
        ref={ref}
        data-slot="sheet-overlay"
        data-state={open ? "open" : "closed"}
        aria-hidden="true"
        className={cn(styles.overlay, styles.scrim, className)}
        {...props}
      />
    )
  }
)
SheetScrim.displayName = "SheetScrim"

const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ className, children, side = "right", showCloseButton = true, onInteractOutside, ...props }, ref) => {
  const { container } = React.useContext(SheetContext)
  const scoped = Boolean(container)
  const [node, setNode] = React.useState<HTMLDivElement | null>(null)

  const setRefs = React.useCallback(
    (el: HTMLDivElement | null) => {
      setNode(el)
      if (typeof ref === "function") ref(el)
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el
    },
    [ref]
  )

  useScopedContainer(container, node)

  const handleInteractOutside: typeof onInteractOutside = (event) => {
    onInteractOutside?.(event)
    if (!scoped || event.defaultPrevented) return
    // Only the scrim dismisses; the page outside the container stays usable.
    const target = event.target
    if (!(target instanceof Element && target.closest('[data-slot="sheet-overlay"]'))) {
      event.preventDefault()
    }
  }

  return (
    <SheetPortal container={container}>
      {scoped ? <SheetScrim /> : <SheetOverlay />}
      <DialogPrimitive.Content
        ref={setRefs}
        data-slot="sheet-content"
        data-side={side}
        data-scoped={scoped ? "" : undefined}
        className={cn(sheetContentVariants({ side }), scoped && styles.scoped, className)}
        onInteractOutside={handleInteractOutside}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="sheet-close" className={styles.closeButton}>
            <XIcon className={styles.closeIcon} />
            <span className={styles.srOnly}>Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </SheetPortal>
  )
})
SheetContent.displayName = "SheetContent"

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(styles.header, className)}
      {...props}
    />
  )
}
SheetHeader.displayName = "SheetHeader"

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(styles.footer, className)}
      {...props}
    />
  )
}
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentProps<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    data-slot="sheet-title"
    className={cn(styles.title, className)}
    {...props}
  />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentProps<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    data-slot="sheet-description"
    className={cn(styles.description, className)}
    {...props}
  />
))
SheetDescription.displayName = "SheetDescription"

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
