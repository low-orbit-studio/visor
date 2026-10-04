"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"
import { SidebarIcon } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  type TooltipContentProps,
} from "../tooltip/tooltip"
import styles from "./sidebar.module.css"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"
const SIDEBAR_MOBILE_MEDIA_QUERY = "(max-width: 768px)"

// `isMobile` is derived from a `matchMedia` subscription via
// `useSyncExternalStore` (below) instead of a `useState` + `useEffect` pair.
// This keeps SSR safe — the server snapshot is always `false` — while avoiding
// a synchronous `setState` inside an effect body, which the React 19 compiler
// lint (`react-hooks/set-state-in-effect`) flags as a cascading-render hazard.
function subscribeIsMobile(callback: () => void) {
  const mql = window.matchMedia(SIDEBAR_MOBILE_MEDIA_QUERY)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

function getIsMobileSnapshot() {
  return window.matchMedia(SIDEBAR_MOBILE_MEDIA_QUERY).matches
}

function getIsMobileServerSnapshot() {
  return false
}

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
  /** Used by Sidebar to tell the provider what kind of sidebars are mounted. */
  registerSidebar: (collapsible: SidebarCollapsible) => () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

/**
 * What the nearest Sidebar tells its menu buttons: whether a button's
 * `tooltip` applies, and where the tooltip portals (the Sidebar's own element,
 * so a class-scoped theme on an ancestor of the sidebar reaches it).
 */
type SidebarScopeProps = {
  collapsible: SidebarCollapsible
  container: HTMLElement | null
}

const SidebarScopeContext = React.createContext<SidebarScopeProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

export interface SidebarProviderProps extends React.ComponentProps<"div"> {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * Binds Cmd/Ctrl+B to toggle the sidebar. Defaults to `true`. The binding is
   * skipped, and `preventDefault` is not called, while the only sidebars
   * mounted are `collapsible="none"` (nothing would toggle). Pass `false` to
   * never bind it.
   */
  keyboardShortcut?: boolean
}

const SidebarProvider = React.forwardRef<HTMLDivElement, SidebarProviderProps>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      keyboardShortcut = true,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = React.useSyncExternalStore(
      subscribeIsMobile,
      getIsMobileSnapshot,
      getIsMobileServerSnapshot
    )
    const [openMobile, setOpenMobile] = React.useState(false)
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open

    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
      [setOpenProp, open]
    )

    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((prev) => !prev)
        : setOpen((prev) => !prev)
    }, [isMobile, setOpen, setOpenMobile])

    // How many collapsible and static (`collapsible="none"`) sidebars are
    // mounted under this provider. A static-only provider has nothing to toggle.
    const mountedRef = React.useRef({ collapsible: 0, none: 0 })
    const registerSidebar = React.useCallback((collapsible: SidebarCollapsible) => {
      const key = collapsible === "none" ? "none" : "collapsible"
      mountedRef.current[key] += 1
      return () => {
        mountedRef.current[key] -= 1
      }
    }, [])

    React.useEffect(() => {
      if (!keyboardShortcut) return
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
          const { collapsible, none } = mountedRef.current
          if (none > 0 && collapsible === 0) return
          event.preventDefault()
          toggleSidebar()
        }
      }
      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [keyboardShortcut, toggleSidebar])

    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContextProps>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
        registerSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar, registerSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={200}>
          <div
            ref={ref}
            data-slot="sidebar-wrapper"
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(styles.wrapper, className)}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

type SidebarCollapsible = "offcanvas" | "icon" | "none"

export interface SidebarProps extends React.ComponentProps<"div"> {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: SidebarCollapsible
  /**
   * `fixed` (default) pins the sidebar to the viewport at full height, the
   * page-sidebar shape. `contained` lays it out inside its parent instead, so
   * an icon rail can sit under an app bar without covering it. A contained
   * sidebar is as tall as the SidebarProvider that holds it.
   */
  position?: "fixed" | "contained"
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      position = "fixed",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { state, registerSidebar } = useSidebar()
    const [element, setElement] = React.useState<HTMLDivElement | null>(null)
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        setElement(node)
        if (typeof ref === "function") ref(node)
        else if (ref) ref.current = node
      },
      [ref]
    )

    React.useEffect(() => registerSidebar(collapsible), [registerSidebar, collapsible])

    const scope = React.useMemo<SidebarScopeProps>(
      () => ({ collapsible, container: element }),
      [collapsible, element]
    )

    if (collapsible === "none") {
      return (
        <SidebarScopeContext.Provider value={scope}>
          <div
            ref={setRefs}
            data-slot="sidebar"
            className={cn(styles.sidebarStatic, className)}
            {...props}
          >
            {children}
          </div>
        </SidebarScopeContext.Provider>
      )
    }

    return (
      <SidebarScopeContext.Provider value={scope}>
        <div
          ref={setRefs}
          className={cn(styles.sidebarContainer, className)}
          data-state={state}
          data-collapsible={state === "collapsed" ? collapsible : ""}
          data-variant={variant}
          data-position={position}
          data-side={side}
          data-slot="sidebar"
          {...props}
        >
          <div
            data-slot="sidebar-gap"
            className={styles.sidebarGap}
          />
          <div
            data-slot="sidebar-inner"
            data-side={side}
            className={styles.sidebarInner}
          >
            <div
              data-sidebar="sidebar"
              className={styles.sidebarContent}
            >
              {children}
            </div>
          </div>
        </div>
      </SidebarScopeContext.Provider>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, onClick, children, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      ref={ref}
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      className={cn(styles.trigger, className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      {children ?? (
        <>
          <SidebarIcon />
          <span className={styles.srOnly}>Toggle Sidebar</span>
        </>
      )}
    </button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, ...props }, ref) => {
    const { toggleSidebar } = useSidebar()

    return (
      <button
        ref={ref}
        data-sidebar="rail"
        data-slot="sidebar-rail"
        aria-label="Toggle Sidebar"
        tabIndex={-1}
        onClick={toggleSidebar}
        title="Toggle Sidebar"
        className={cn(styles.rail, className)}
        {...props}
      />
    )
  }
)
SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef<HTMLElement, React.ComponentProps<"main">>(
  ({ className, ...props }, ref) => (
    <main
      ref={ref}
      data-slot="sidebar-inset"
      className={cn(styles.inset, className)}
      {...props}
    />
  )
)
SidebarInset.displayName = "SidebarInset"

const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn(styles.header, className)}
      {...props}
    />
  )
)
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn(styles.footer, className)}
      {...props}
    />
  )
)
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<HTMLHRElement, React.ComponentProps<"hr">>(
  ({ className, ...props }, ref) => (
    <hr
      ref={ref}
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn(styles.separator, className)}
      {...props}
    />
  )
)
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(styles.contentArea, className)}
      {...props}
    />
  )
)
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn(styles.group, className)}
      {...props}
    />
  )
)
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(styles.groupLabel, className)}
      {...props}
    />
  )
)
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupAction = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(styles.groupAction, className)}
      {...props}
    />
  )
)
SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn(styles.groupContent, className)}
      {...props}
    />
  )
)
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn(styles.menu, className)}
      {...props}
    />
  )
)
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn(styles.menuItem, className)}
      {...props}
    />
  )
)
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(styles.menuButton, {
  variants: {
    variant: {
      default: styles.menuButtonDefault,
      outline: styles.menuButtonOutline,
    },
    size: {
      default: styles.menuButtonSizeDefault,
      sm: styles.menuButtonSizeSm,
      lg: styles.menuButtonSizeLg,
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

export type SidebarMenuButtonTooltip =
  | string
  | (Omit<TooltipContentProps, "children"> & { children: React.ReactNode })

export interface SidebarMenuButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof sidebarMenuButtonVariants> {
  /** Render the child (a Next `<Link>`, an `<a>`) as the button, via Radix Slot. */
  asChild?: boolean
  isActive?: boolean
  /**
   * Shown in a Tooltip when the sidebar is an icon rail: collapsed to icons
   * (`collapsible="icon"`), or a `collapsible="none"` sidebar (a static rail has
   * no collapsed state, so passing `tooltip` is the opt-in). Never shown on
   * mobile or in an expanded sidebar, where the visible label names the item.
   * A string (or a string `children`) also names the button for assistive tech
   * while the label is hidden, unless the button sets its own `aria-label` or
   * `aria-labelledby`. Pass an object to set `side`, `container` and the rest of
   * TooltipContent's props; the tooltip portals into the Sidebar by default.
   */
  tooltip?: SidebarMenuButtonTooltip
}

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  (
    {
      asChild = false,
      className,
      variant = "default",
      size = "default",
      isActive,
      tooltip,
      children,
      ...props
    },
    ref
  ) => {
    const { state, isMobile } = useSidebar()
    const scope = React.useContext(SidebarScopeContext)
    const [tooltipOpen, setTooltipOpen] = React.useState(false)

    const tooltipApplies =
      tooltip != null &&
      !isMobile &&
      scope != null &&
      (scope.collapsible === "none" ||
        (scope.collapsible === "icon" && state === "collapsed"))

    const tooltipProps = typeof tooltip === "object" ? tooltip : undefined
    const tooltipLabel = typeof tooltip === "string" ? tooltip : tooltipProps?.children
    const needsName =
      tooltipApplies &&
      typeof tooltipLabel === "string" &&
      props["aria-label"] === undefined &&
      props["aria-labelledby"] === undefined

    const Comp = asChild ? Slot : "button"
    const button = (
      <Comp
        ref={ref}
        data-slot="sidebar-menu-button"
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive || undefined}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...(needsName ? { "aria-label": tooltipLabel as string } : null)}
        {...props}
      >
        {children}
      </Comp>
    )

    if (tooltip == null) return button

    const { children: tooltipChildren, ...contentProps } =
      typeof tooltip === "object" ? tooltip : { children: tooltip }

    return (
      <Tooltip open={tooltipApplies && tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          container={scope?.container}
          {...contentProps}
        >
          {tooltipChildren}
        </TooltipContent>
      </Tooltip>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { showOnHover?: boolean }
>(({ className, showOnHover, ...props }, ref) => (
  <button
    ref={ref}
    data-slot="sidebar-menu-action"
    data-sidebar="menu-action"
    className={cn(
      styles.menuAction,
      showOnHover && styles.menuActionHover,
      className
    )}
    {...props}
  />
))
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(styles.menuBadge, className)}
      {...props}
    />
  )
)
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSub = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(styles.menuSub, className)}
      {...props}
    />
  )
)
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn(styles.menuSubItem, className)}
      {...props}
    />
  )
)
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

export interface SidebarMenuSubButtonProps extends React.ComponentProps<"a"> {
  asChild?: boolean
  size?: "sm" | "md"
  isActive?: boolean
}

const SidebarMenuSubButton = React.forwardRef<HTMLAnchorElement, SidebarMenuSubButtonProps>(
  ({ className, size = "md", isActive, ...props }, ref) => (
    <a
      ref={ref}
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive || undefined}
      className={cn(
        styles.menuSubButton,
        size === "sm" && styles.menuSubButtonSm,
        className
      )}
      {...props}
    />
  )
)
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
  sidebarMenuButtonVariants,
}
