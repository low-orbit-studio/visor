import * as React from "react"
import { Flag, Lock, Check } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./challenge-card.module.css"

// ChallengeCard — adversarial challenge message with a human gate affordance.
//
// Distinct from Alert: ChallengeCard is for AI-generated push-back that requires
// an explicit human decision. Alert is for passive informational notices.
//
// Built standalone (not on Alert internals) because the warning-toned filled
// primary action and gate affordance are outside Alert's scope. Alert wraps
// a <div role="alert"> with variant color slots; ChallengeCard is a compound
// component with its own action + gate semantics.

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export interface ChallengeCardProps extends React.HTMLAttributes<HTMLDivElement> {}

const ChallengeCard = React.forwardRef<HTMLDivElement, ChallengeCardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="challenge-card"
        role="alert"
        className={cn(styles.root, className)}
        {...props}
      />
    )
  }
)
ChallengeCard.displayName = "ChallengeCard"

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export interface ChallengeCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Override the default Flag icon. Pass null to suppress the icon. */
  icon?: React.ReactNode | null
}

const ChallengeCardHeader = React.forwardRef<HTMLDivElement, ChallengeCardHeaderProps>(
  ({ className, icon, children, ...props }, ref) => {
    const resolvedIcon = icon === undefined ? <Flag weight="fill" /> : icon
    return (
      <div
        ref={ref}
        data-slot="challenge-card-header"
        className={cn(styles.header, className)}
        {...props}
      >
        {resolvedIcon !== null && (
          <span className={styles.headerIcon} aria-hidden="true">
            {resolvedIcon}
          </span>
        )}
        {children}
      </div>
    )
  }
)
ChallengeCardHeader.displayName = "ChallengeCardHeader"

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------

export interface ChallengeCardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

const ChallengeCardBody = React.forwardRef<HTMLDivElement, ChallengeCardBodyProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="challenge-card-body"
        className={cn(styles.body, className)}
        {...props}
      />
    )
  }
)
ChallengeCardBody.displayName = "ChallengeCardBody"

// ---------------------------------------------------------------------------
// Actions row
// ---------------------------------------------------------------------------

export interface ChallengeCardActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

const ChallengeCardActions = React.forwardRef<HTMLDivElement, ChallengeCardActionsProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="challenge-card-actions"
        className={cn(styles.actions, className)}
        {...props}
      />
    )
  }
)
ChallengeCardActions.displayName = "ChallengeCardActions"

// ---------------------------------------------------------------------------
// Action button
// ---------------------------------------------------------------------------

export interface ChallengeCardActionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** "primary" = filled warning-toned; "ghost" = transparent with border. */
  variant?: "primary" | "ghost"
  /** Optional Phosphor icon. Primary defaults to a Check icon. */
  icon?: React.ReactNode | null
}

const ChallengeCardAction = React.forwardRef<HTMLButtonElement, ChallengeCardActionProps>(
  ({ className, variant = "primary", icon, children, ...props }, ref) => {
    const defaultIcon =
      variant === "primary" ? <Check weight="bold" /> : undefined
    const resolvedIcon = icon === undefined ? defaultIcon : icon

    return (
      <button
        ref={ref}
        data-slot="challenge-card-action"
        data-variant={variant}
        className={cn(
          styles.action,
          variant === "primary" ? styles.actionPrimary : styles.actionGhost,
          className
        )}
        {...props}
      >
        {resolvedIcon !== null && resolvedIcon !== undefined && (
          <span className={styles.actionIcon} aria-hidden="true">
            {resolvedIcon}
          </span>
        )}
        {children}
      </button>
    )
  }
)
ChallengeCardAction.displayName = "ChallengeCardAction"

// ---------------------------------------------------------------------------
// Gate indicator
// ---------------------------------------------------------------------------

export interface ChallengeCardGateProps extends React.HTMLAttributes<HTMLSpanElement> {}

const ChallengeCardGate = React.forwardRef<HTMLSpanElement, ChallengeCardGateProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-slot="challenge-card-gate"
        className={cn(styles.gate, className)}
        {...props}
      >
        <span className={styles.gateIcon} aria-hidden="true">
          <Lock weight="fill" />
        </span>
        {children ?? "You hold the gate"}
      </span>
    )
  }
)
ChallengeCardGate.displayName = "ChallengeCardGate"

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  ChallengeCard,
  ChallengeCardHeader,
  ChallengeCardBody,
  ChallengeCardActions,
  ChallengeCardAction,
  ChallengeCardGate,
}
