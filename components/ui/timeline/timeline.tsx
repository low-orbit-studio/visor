import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./timeline.module.css"

const Timeline = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="timeline"
        className={cn(styles.timeline, className)}
        {...props}
      />
    )
  }
)
Timeline.displayName = "Timeline"

export interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: "complete" | "active" | "upcoming"
}

const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ className, status = "upcoming", ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="timeline-item"
        data-status={status}
        className={cn(styles.item, styles[`item--${status}`], className)}
        {...props}
      />
    )
  }
)
TimelineItem.displayName = "TimelineItem"

const TimelineIcon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="timeline-icon"
        className={cn(styles.icon, className)}
        {...props}
      />
    )
  }
)
TimelineIcon.displayName = "TimelineIcon"

const TimelineContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="timeline-content"
        className={cn(styles.content, className)}
        {...props}
      />
    )
  }
)
TimelineContent.displayName = "TimelineContent"

const TimelineTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="timeline-title"
        className={cn(styles.title, className)}
        {...props}
      />
    )
  }
)
TimelineTitle.displayName = "TimelineTitle"

const TimelineDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      data-slot="timeline-description"
      className={cn(styles.description, className)}
      {...props}
    />
  )
})
TimelineDescription.displayName = "TimelineDescription"

export interface TimelineTimestampProps
  extends React.HTMLAttributes<HTMLTimeElement> {
  dateTime?: string
}

const TimelineTimestamp = React.forwardRef<HTMLTimeElement, TimelineTimestampProps>(
  ({ className, ...props }, ref) => {
    return (
      <time
        ref={ref}
        data-slot="timeline-timestamp"
        className={cn(styles.timestamp, className)}
        {...props}
      />
    )
  }
)
TimelineTimestamp.displayName = "TimelineTimestamp"

export {
  Timeline,
  TimelineItem,
  TimelineIcon,
  TimelineContent,
  TimelineTitle,
  TimelineDescription,
  TimelineTimestamp,
}
