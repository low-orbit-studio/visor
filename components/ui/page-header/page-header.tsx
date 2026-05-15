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

/** Token preset values for the `titleSize` prop. */
const TITLE_SIZE_TOKENS = ["default", "marquee"] as const
type TitleSizeToken = (typeof TITLE_SIZE_TOKENS)[number]

/** Token preset values for the `titleFamily` prop. */
const TITLE_FAMILY_TOKENS = ["heading", "display"] as const
type TitleFamilyToken = (typeof TITLE_FAMILY_TOKENS)[number]

function isTitleSizeToken(value: string): value is TitleSizeToken {
  return (TITLE_SIZE_TOKENS as readonly string[]).includes(value)
}

function isTitleFamilyToken(value: string): value is TitleFamilyToken {
  return (TITLE_FAMILY_TOKENS as readonly string[]).includes(value)
}

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
  /**
   * Title font-size override. Token presets (`"default" | "marquee"`) map to
   * `data-title-size` attributes; any other string is forwarded as a raw CSS
   * length on the `--page-header-title-size` custom property.
   */
  titleSize?: "default" | "marquee" | (string & {})
  /**
   * Title font-family override. Token presets (`"heading" | "display"`) map
   * to `data-title-family` attributes; any other string is forwarded as a
   * raw CSS family on the `--page-header-title-family` custom property.
   */
  titleFamily?: "heading" | "display" | (string & {})
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
      titleSize,
      titleFamily,
      ...props
    },
    ref
  ) => {
    const Root = as as React.ElementType
    const Title = titleAs as React.ElementType

    const titleSizeToken =
      typeof titleSize === "string" && isTitleSizeToken(titleSize)
        ? titleSize
        : undefined
    const titleFamilyToken =
      typeof titleFamily === "string" && isTitleFamilyToken(titleFamily)
        ? titleFamily
        : undefined

    const rawTitleSize =
      typeof titleSize === "string" && !titleSizeToken ? titleSize : undefined
    const rawTitleFamily =
      typeof titleFamily === "string" && !titleFamilyToken
        ? titleFamily
        : undefined

    const titleStyle: React.CSSProperties | undefined =
      rawTitleSize || rawTitleFamily
        ? {
            ...(rawTitleSize
              ? ({
                  "--page-header-title-size": rawTitleSize,
                } as React.CSSProperties)
              : null),
            ...(rawTitleFamily
              ? ({
                  "--page-header-title-family": rawTitleFamily,
                } as React.CSSProperties)
              : null),
          }
        : undefined

    // When a raw string is supplied, switch the title into the "marquee" /
    // "display" rules that consume the custom property so the override
    // actually takes effect. Token values map directly to data-attributes.
    const resolvedTitleSizeAttr =
      titleSizeToken ?? (rawTitleSize ? "marquee" : undefined)
    const resolvedTitleFamilyAttr =
      titleFamilyToken ?? (rawTitleFamily ? "display" : undefined)

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
            <Title
              data-slot="page-header-title"
              data-title-size={resolvedTitleSizeAttr}
              data-title-family={resolvedTitleFamilyAttr}
              className={styles.title}
              style={titleStyle}
            >
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
