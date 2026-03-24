import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./banner.module.css"

const bannerVariants = cva(styles.base, {
  variants: {
    intent: {
      info: styles.intentInfo,
      warning: styles.intentWarning,
      error: styles.intentError,
      success: styles.intentSuccess,
    },
    position: {
      inline: styles.positionInline,
      sticky: styles.positionSticky,
    },
  },
  defaultVariants: {
    intent: "info",
    position: "inline",
  },
})

export interface BannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bannerVariants> {}

const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  ({ className, intent, position, ...props }, ref) => {
    const role = intent === "warning" || intent === "error" ? "alert" : "status"
    return (
      <div
        ref={ref}
        data-slot="banner"
        role={role}
        className={cn(bannerVariants({ intent, position }), className)}
        {...props}
      />
    )
  }
)
Banner.displayName = "Banner"

const BannerTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="banner-title"
        className={cn(styles.title, className)}
        {...props}
      />
    )
  }
)
BannerTitle.displayName = "BannerTitle"

const BannerDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="banner-description"
        className={cn(styles.description, className)}
        {...props}
      />
    )
  }
)
BannerDescription.displayName = "BannerDescription"

const BannerAction = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="banner-action"
        className={cn(styles.action, className)}
        {...props}
      />
    )
  }
)
BannerAction.displayName = "BannerAction"

export { Banner, BannerTitle, BannerDescription, BannerAction, bannerVariants }
