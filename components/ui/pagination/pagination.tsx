import * as React from "react"
import { CaretLeftIcon, CaretRightIcon, DotsThreeIcon } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./pagination.module.css"

const Pagination = React.forwardRef<HTMLElement, React.ComponentProps<"nav">>(
  ({ className, ...props }, ref) => (
    <nav
      ref={ref}
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn(styles.root, className)}
      {...props}
    />
  )
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-slot="pagination-content"
      className={cn(styles.content, className)}
      {...props}
    />
  )
)
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      data-slot="pagination-item"
      className={cn(styles.item, className)}
      {...props}
    />
  )
)
PaginationItem.displayName = "PaginationItem"

export interface PaginationLinkProps extends React.ComponentProps<"a"> {
  isActive?: boolean
  size?: "default" | "sm" | "lg"
}

const PaginationLink = React.forwardRef<HTMLAnchorElement, PaginationLinkProps>(
  ({ className, isActive, size = "default", ...props }, ref) => (
    <a
      ref={ref}
      data-slot="pagination-link"
      aria-current={isActive ? "page" : undefined}
      data-active={isActive || undefined}
      data-size={size}
      className={cn(
        styles.link,
        isActive && styles.linkActive,
        size === "sm" && styles.linkSm,
        size === "lg" && styles.linkLg,
        className
      )}
      {...props}
    />
  )
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = React.forwardRef<HTMLAnchorElement, React.ComponentProps<"a">>(
  ({ className, ...props }, ref) => (
    <a
      ref={ref}
      data-slot="pagination-previous"
      aria-label="Go to previous page"
      className={cn(styles.link, styles.navLink, className)}
      {...props}
    >
      <CaretLeftIcon className={styles.icon} />
      <span>Previous</span>
    </a>
  )
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = React.forwardRef<HTMLAnchorElement, React.ComponentProps<"a">>(
  ({ className, ...props }, ref) => (
    <a
      ref={ref}
      data-slot="pagination-next"
      aria-label="Go to next page"
      className={cn(styles.link, styles.navLink, className)}
      {...props}
    >
      <span>Next</span>
      <CaretRightIcon className={styles.icon} />
    </a>
  )
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span">>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="pagination-ellipsis"
      aria-hidden="true"
      className={cn(styles.ellipsis, className)}
      {...props}
    >
      <DotsThreeIcon />
      <span className={styles.srOnly}>More pages</span>
    </span>
  )
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
