"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ArrowLeftIcon, XIcon } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./dialog.module.css"

type DialogPresentation = "dialog" | "sheet" | "responsive"

interface DialogContextValue {
  /** The presentation actually in force: `responsive` has already been resolved. */
  presentation: "dialog" | "sheet"
  container: HTMLElement | null | undefined
  open: boolean
}

const DialogContext = React.createContext<DialogContextValue>({
  presentation: "dialog",
  container: undefined,
  open: false,
})

export interface DialogProps
  extends React.ComponentProps<typeof DialogPrimitive.Root> {
  /**
   * How the content is presented. `dialog` is a centred modal, `sheet` is a
   * bottom sheet, `responsive` is a dialog from `breakpoint` up and a sheet
   * below it. The content, focus trap and Escape handling are identical.
   */
  presentation?: DialogPresentation
  /**
   * Viewport width at which `responsive` switches from sheet to dialog. A
   * number is px; a string is any CSS length (`"40rem"`). Defaults to 640.
   */
  breakpoint?: number | string
  /**
   * Element the overlay and content portal into, covering only that element.
   * A scoped dialog is not modal: it traps focus inside the content and makes
   * the container's other children `inert`, but leaves everything outside the
   * container interactive (Radix modal mode would aria-hide the page and block
   * pointer events on `body`). Pass the element itself (hold it in state), not
   * a ref. The container is given `position: relative` if it is `static`.
   */
  container?: HTMLElement | null
}

function Dialog({
  presentation = "dialog",
  breakpoint = 640,
  container,
  modal = true,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...props
}: DialogProps) {
  const minWidth = typeof breakpoint === "number" ? `${breakpoint}px` : breakpoint
  const isWide = useMinWidth(minWidth)
  const resolved =
    presentation === "responsive" ? (isWide ? "dialog" : "sheet") : presentation

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = openProp ?? uncontrolledOpen
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [onOpenChange]
  )

  const value = React.useMemo(
    () => ({ presentation: resolved, container, open }),
    [resolved, container, open]
  )

  return (
    <DialogContext.Provider value={value}>
      <DialogPrimitive.Root
        data-slot="dialog"
        modal={container ? false : modal}
        open={open}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </DialogContext.Provider>
  )
}
Dialog.displayName = "Dialog"

/** True when the viewport is at least `minWidth` wide. Desktop where matchMedia is absent. */
function useMinWidth(minWidth: string): boolean {
  const query = `(min-width: ${minWidth})`
  const [matches, setMatches] = React.useState<boolean>(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : true
  )
  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
    const mq = window.matchMedia(query)
    setMatches(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [query])
  return matches
}

/**
 * Scoped dialogs: make every other child of the container inert while open, and
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

/**
 * Bottom sheet: keep the panel above the on-screen keyboard. The layout
 * viewport does not shrink on iOS, so size to the visual viewport and lift the
 * panel by the keyboard's height; keep the focused field in view.
 */
function useKeyboardAvoidance(enabled: boolean, node: HTMLElement | null) {
  React.useEffect(() => {
    if (!enabled || !node || typeof window === "undefined") return
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      node.style.setProperty("--dialog-viewport-height", `${vv.height}px`)
      node.style.setProperty("--dialog-keyboard-inset", `${inset}px`)
      const active = document.activeElement
      if (inset > 0 && active instanceof HTMLElement && node.contains(active)) {
        active.scrollIntoView?.({ block: "nearest" })
      }
    }
    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
      node.style.removeProperty("--dialog-viewport-height")
      node.style.removeProperty("--dialog-keyboard-inset")
    }
  }, [enabled, node])
}

const DRAG_DISMISS_DISTANCE = 80

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}
DialogTrigger.displayName = "DialogTrigger"

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}
DialogClose.displayName = "DialogClose"

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}
DialogPortal.displayName = "DialogPortal"

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentProps<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    data-slot="dialog-overlay"
    className={cn(styles.overlay, className)}
    {...props}
  />
))
DialogOverlay.displayName = "DialogOverlay"

/** Backdrop for a scoped dialog. Radix renders no overlay outside modal mode. */
const DialogScrim = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    const { open } = React.useContext(DialogContext)
    return (
      <div
        ref={ref}
        data-slot="dialog-overlay"
        data-state={open ? "open" : "closed"}
        aria-hidden="true"
        className={cn(styles.overlay, styles.scrim, className)}
        {...props}
      />
    )
  }
)
DialogScrim.displayName = "DialogScrim"

export interface DialogContentProps
  extends React.ComponentProps<typeof DialogPrimitive.Content> {
  /** Show a drag handle (sheet presentation only). Dragging down dismisses. */
  showHandle?: boolean
}

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, showHandle = false, onInteractOutside, onFocus, ...props }, ref) => {
  const { presentation, container } = React.useContext(DialogContext)
  const scoped = Boolean(container)
  const isSheet = presentation === "sheet"
  const [node, setNode] = React.useState<HTMLDivElement | null>(null)
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const dragStart = React.useRef<number | null>(null)

  const setRefs = React.useCallback(
    (el: HTMLDivElement | null) => {
      setNode(el)
      if (typeof ref === "function") ref(el)
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el
    },
    [ref]
  )

  useScopedContainer(container, node)
  useKeyboardAvoidance(isSheet && !scoped, node)

  const handleInteractOutside: typeof onInteractOutside = (event) => {
    onInteractOutside?.(event)
    if (!scoped || event.defaultPrevented) return
    // Only the scrim dismisses. A press on the page outside the container, or on
    // the container's inert siblings, must leave the dialog open.
    const target = event.target
    if (!(target instanceof Element && target.closest('[data-slot="dialog-overlay"]'))) {
      event.preventDefault()
    }
  }

  const handleFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    onFocus?.(event)
    const target = event.target
    if (isSheet && target instanceof HTMLElement && target.matches("input, textarea, select, [contenteditable]")) {
      requestAnimationFrame(() => target.scrollIntoView?.({ block: "nearest" }))
    }
  }

  const dragTo = (clientY: number, commit: boolean) => {
    if (dragStart.current === null || !node) return
    const dy = Math.max(0, clientY - dragStart.current)
    if (!commit) {
      node.style.transition = "none"
      node.style.transform = `translateY(${dy}px)`
      return
    }
    dragStart.current = null
    node.style.transition = ""
    node.style.transform = ""
    if (dy > DRAG_DISMISS_DISTANCE) closeRef.current?.click()
  }

  return (
    <DialogPortal container={container}>
      {scoped ? <DialogScrim /> : <DialogOverlay />}
      <DialogPrimitive.Content
        ref={setRefs}
        data-slot="dialog-content"
        data-presentation={presentation}
        data-scoped={scoped ? "" : undefined}
        className={cn(
          styles.content,
          isSheet && styles.presentationSheet,
          scoped && styles.scoped,
          className
        )}
        onInteractOutside={handleInteractOutside}
        onFocus={handleFocus}
        {...props}
      >
        {isSheet && showHandle && (
          <div
            data-slot="dialog-handle"
            aria-hidden="true"
            className={styles.handle}
            onPointerDown={(e) => {
              dragStart.current = e.clientY
              e.currentTarget.setPointerCapture?.(e.pointerId)
            }}
            onPointerMove={(e) => dragTo(e.clientY, false)}
            onPointerUp={(e) => dragTo(e.clientY, true)}
            onPointerCancel={() => dragTo(dragStart.current ?? 0, true)}
          />
        )}
        {children}
        <DialogPrimitive.Close ref={closeRef} className={styles.closeButton}>
          <XIcon className={styles.closeIcon} />
          <span className={styles.srOnly}>Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = "DialogContent"

export interface DialogHeaderProps extends React.ComponentProps<"div"> {
  /** Leading back action, rendered before the title (see `DialogBack`). */
  back?: React.ReactNode
}

function DialogHeader({ className, back, children, ...props }: DialogHeaderProps) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(styles.header, back ? styles.headerWithBack : undefined, className)}
      {...props}
    >
      {back ? (
        <>
          <div data-slot="dialog-back-slot" className={styles.backSlot}>{back}</div>
          <div className={styles.headerBody}>{children}</div>
        </>
      ) : (
        children
      )}
    </div>
  )
}
DialogHeader.displayName = "DialogHeader"

const DialogBack = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, children, type = "button", "aria-label": ariaLabel = "Back", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      data-slot="dialog-back"
      aria-label={ariaLabel}
      className={cn(styles.backButton, className)}
      {...props}
    >
      {children ?? <ArrowLeftIcon className={styles.closeIcon} aria-hidden="true" />}
    </button>
  )
)
DialogBack.displayName = "DialogBack"

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(styles.footer, className)}
      {...props}
    />
  )
}
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentProps<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    data-slot="dialog-title"
    className={cn(styles.title, className)}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentProps<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    data-slot="dialog-description"
    className={cn(styles.description, className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogBack,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
