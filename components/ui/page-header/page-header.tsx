import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./page-header.module.css"

const pageHeaderVariants = cva(styles.base, {
  variants: {
    size: {
      sm: styles.sizeSm,
      md: styles.sizeMd,
      lg: styles.sizeLg,
    },
  },
  defaultVariants: {
    size: "md",
  },
})

type PageHeaderElement = "header" | "section" | "div"
type TitleElement = "h1" | "h2" | "h3"

export interface PageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title">,
    VariantProps<typeof pageHeaderVariants> {
  /** Optional small uppercase label rendered above the title. */
  eyebrow?: React.ReactNode
  /** Page heading content. Rendered in the element given by `titleAs`. */
  title: React.ReactNode
  /** Optional supporting copy rendered below the title. */
  description?: React.ReactNode
  /** Optional ReactNode rendered above the title row (typically a Breadcrumb). */
  breadcrumb?: React.ReactNode
  /** Optional ReactNode rendered on the right side of the title row. */
  actions?: React.ReactNode
  /** Root element tag. Defaults to `header`. */
  as?: PageHeaderElement
  /** Heading level for the title. Defaults to `h1`. */
  titleAs?: TitleElement
}

const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  (
    {
      className,
      size,
      eyebrow,
      title,
      description,
      breadcrumb,
      actions,
      as = "header",
      titleAs = "h1",
      ...props
    },
    ref
  ) => {
    const Root = as as React.ElementType
    const Title = titleAs as React.ElementType

    return (
      <Root
        ref={ref}
        data-slot="page-header"
        className={cn(pageHeaderVariants({ size }), className)}
        {...props}
      >
        {breadcrumb ? (
          <div data-slot="page-header-breadcrumb" className={styles.breadcrumb}>
            {breadcrumb}
          </div>
        ) : null}
        <div data-slot="page-header-row" className={styles.row}>
          <div data-slot="page-header-text" className={styles.text}>
            {eyebrow ? (
              <div data-slot="page-header-eyebrow" className={styles.eyebrow}>
                {eyebrow}
              </div>
            ) : null}
            <Title data-slot="page-header-title" className={styles.title}>
              {title}
            </Title>
            {description ? (
              <p
                data-slot="page-header-description"
                className={styles.description}
              >
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div data-slot="page-header-actions" className={styles.actions}>
              {actions}
            </div>
          ) : null}
        </div>
      </Root>
    )
  }
)
PageHeader.displayName = "PageHeader"

export { PageHeader, pageHeaderVariants }
