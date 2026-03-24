"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ListIcon } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./navbar.module.css"

const navbarVariants = cva(styles.root, {
  variants: {
    variant: {
      default: styles.variantDefault,
      transparent: styles.variantTransparent,
      bordered: styles.variantBordered,
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface NavbarProps
  extends React.ComponentProps<"nav">,
    VariantProps<typeof navbarVariants> {}

const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  ({ className, variant, ...props }, ref) => (
    <nav
      ref={ref}
      aria-label="main"
      data-slot="navbar"
      className={cn(navbarVariants({ variant }), className)}
      {...props}
    />
  )
)
Navbar.displayName = "Navbar"

const NavbarBrand = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="navbar-brand"
      className={cn(styles.brand, className)}
      {...props}
    />
  )
)
NavbarBrand.displayName = "NavbarBrand"

export interface NavbarContentProps extends React.ComponentProps<"div"> {
  align?: "start" | "center" | "end"
}

const NavbarContent = React.forwardRef<HTMLDivElement, NavbarContentProps>(
  ({ className, align = "start", ...props }, ref) => (
    <div
      ref={ref}
      data-slot="navbar-content"
      data-align={align}
      className={cn(
        styles.content,
        align === "start" && styles.contentStart,
        align === "center" && styles.contentCenter,
        align === "end" && styles.contentEnd,
        className
      )}
      {...props}
    />
  )
)
NavbarContent.displayName = "NavbarContent"

const NavbarItem = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="navbar-item"
      className={cn(styles.item, className)}
      {...props}
    />
  )
)
NavbarItem.displayName = "NavbarItem"

export interface NavbarLinkProps extends React.ComponentProps<"a"> {
  isActive?: boolean
}

const NavbarLink = React.forwardRef<HTMLAnchorElement, NavbarLinkProps>(
  ({ className, isActive, ...props }, ref) => (
    <a
      ref={ref}
      data-slot="navbar-link"
      aria-current={isActive ? "page" : undefined}
      data-active={isActive || undefined}
      className={cn(styles.link, isActive && styles.linkActive, className)}
      {...props}
    />
  )
)
NavbarLink.displayName = "NavbarLink"

const NavbarToggle = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      data-slot="navbar-toggle"
      aria-label="Toggle navigation"
      className={cn(styles.toggle, className)}
      {...props}
    >
      <ListIcon className={styles.toggleIcon} />
    </button>
  )
)
NavbarToggle.displayName = "NavbarToggle"

export {
  Navbar,
  navbarVariants,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarLink,
  NavbarToggle,
}
