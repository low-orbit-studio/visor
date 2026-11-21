"use client"

import * as React from "react"
import { Check, Lock } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./stepper.module.css"

/* ─── Context ──────────────────────────────────────────────────────────────── */

interface StepperContextValue {
  activeStep: number
  orientation: "horizontal" | "vertical"
  variant: "default" | "prominent" | "rail"
}

const StepperContext = React.createContext<StepperContextValue>({
  activeStep: 0,
  orientation: "horizontal",
  variant: "default",
})

function useStepperContext() {
  return React.useContext(StepperContext)
}

/* ─── Stepper ──────────────────────────────────────────────────────────────── */

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  activeStep?: number
  orientation?: "horizontal" | "vertical"
  /**
   * Visual treatment variant.
   * - `"default"` — standard step indicator, suitable for multi-step forms and
   *   linear wizards. Use anywhere a stepper supports secondary navigation.
   * - `"prominent"` — enhanced treatment for vertical derivation spines or
   *   primary-navigation surfaces: active row gets a primary-soft tint, the
   *   active bullet renders a concentric halo + filled pulse dot (instead of
   *   a step number), and complete-to-next rails render in a primary-line tint.
   *   Best used vertically. Fully theme-agnostic — tokens resolve against the
   *   active theme, so monochromatic themes stay restrained while colorful ones
   *   get the intended pop.
   * - `"rail"` — a side list of form sections: each trigger is one row-wide
   *   button holding a dot mark and its label (pass the label as the trigger's
   *   children), with no circles and no separators. The current row's mark
   *   stretches to a pill. The states are one ink at 100/64/40/24%: the
   *   theme's `--text-primary`, or under `data-glass="on"` the glass layer's
   *   scrim ink (white) with its shadow; over a photo, sit it on the glass
   *   layer's `scrim` so white clears contrast.
   *   Use with `orientation="vertical"`.
   */
  variant?: "default" | "prominent" | "rail"
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ className, activeStep = 0, orientation = "horizontal", variant = "default", children, ...props }, ref) => {
    const contextValue = React.useMemo(
      () => ({ activeStep, orientation, variant }),
      [activeStep, orientation, variant]
    )

    return (
      <StepperContext.Provider value={contextValue}>
        <div
          ref={ref}
          role="group"
          aria-label="Progress"
          data-slot="stepper"
          data-orientation={orientation}
          data-variant={variant}
          className={cn(
            styles.stepper,
            orientation === "vertical" && styles.stepperVertical,
            variant === "rail" && styles.stepperRail,
            className
          )}
          {...props}
        >
          {children}
        </div>
      </StepperContext.Provider>
    )
  }
)
Stepper.displayName = "Stepper"

/* ─── StepperItem ──────────────────────────────────────────────────────────── */

export interface StepperItemProps extends React.HTMLAttributes<HTMLDivElement> {
  step: number
  status?: "complete" | "active" | "upcoming" | "locked"
}

const StepperItem = React.forwardRef<HTMLDivElement, StepperItemProps>(
  ({ className, step, status, children, ...props }, ref) => {
    const { activeStep, orientation, variant } = useStepperContext()

    const resolvedStatus =
      status ?? (step < activeStep ? "complete" : step === activeStep ? "active" : "upcoming")

    return (
      <div
        ref={ref}
        data-slot="stepper-item"
        data-step={step}
        data-status={resolvedStatus}
        data-orientation={orientation}
        data-variant={variant}
        aria-current={resolvedStatus === "active" && variant !== "rail" ? "step" : undefined}
        className={cn(
          styles.item,
          orientation === "vertical" && styles.itemVertical,
          variant === "prominent" && styles.itemProminent,
          variant === "prominent" && resolvedStatus === "active" && styles.itemProminentActive,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
StepperItem.displayName = "StepperItem"

/* ─── StepperTrigger ───────────────────────────────────────────────────────── */

export interface StepperTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  step: number
  status?: "complete" | "active" | "upcoming" | "locked"
}

const StepperTrigger = React.forwardRef<HTMLButtonElement, StepperTriggerProps>(
  ({ className, step, status, children, onClick, ...props }, ref) => {
    const { activeStep, variant } = useStepperContext()

    const resolvedStatus =
      status ?? (step < activeStep ? "complete" : step === activeStep ? "active" : "upcoming")

    const isLocked = resolvedStatus === "locked"
    const isRail = variant === "rail"
    const isProminentActive = variant === "prominent" && resolvedStatus === "active"

    const handleClick = isLocked
      ? undefined
      : onClick

    return (
      <button
        ref={ref}
        type="button"
        data-slot="stepper-trigger"
        data-status={resolvedStatus}
        data-variant={variant}
        aria-disabled={isLocked || undefined}
        aria-current={isRail && resolvedStatus === "active" ? "step" : undefined}
        tabIndex={isLocked ? -1 : undefined}
        className={cn(
          isRail ? styles.railTrigger : [styles.trigger, styles[`trigger--${resolvedStatus}`]],
          variant === "prominent" && styles[`triggerProminent--${resolvedStatus}`],
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {isRail ? (
          <>
            <span className={styles.railMark} aria-hidden="true" />
            {children}
          </>
        ) : resolvedStatus === "complete" ? (
          <Check size={14} weight="bold" aria-hidden="true" />
        ) : resolvedStatus === "locked" ? (
          <Lock size={12} weight="bold" aria-hidden="true" />
        ) : isProminentActive ? (
          /* Pulse dot replaces the step number in prominent active state */
          <span className={styles.pulseDot} aria-hidden="true" />
        ) : (
          children ?? step + 1
        )}
        <span className={styles.srOnly}>
          {resolvedStatus === "complete"
            ? "Completed"
            : resolvedStatus === "locked"
              ? `Step ${step + 1}, locked`
              : `Step ${step + 1}`}
        </span>
      </button>
    )
  }
)
StepperTrigger.displayName = "StepperTrigger"

/* ─── StepperTitle ─────────────────────────────────────────────────────────── */

const StepperTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="stepper-title"
        className={cn(styles.title, className)}
        {...props}
      />
    )
  }
)
StepperTitle.displayName = "StepperTitle"

/* ─── StepperDescription ───────────────────────────────────────────────────── */

const StepperDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      data-slot="stepper-description"
      className={cn(styles.description, className)}
      {...props}
    />
  )
})
StepperDescription.displayName = "StepperDescription"

/* ─── StepperSeparator ─────────────────────────────────────────────────────── */

export interface StepperSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  complete?: boolean
}

const StepperSeparator = React.forwardRef<HTMLDivElement, StepperSeparatorProps>(
  ({ className, complete = false, ...props }, ref) => {
    const { orientation, variant } = useStepperContext()

    return (
      <div
        ref={ref}
        role="separator"
        data-slot="stepper-separator"
        data-orientation={orientation}
        data-complete={complete || undefined}
        data-variant={variant}
        className={cn(
          styles.separator,
          orientation === "vertical" && styles.separatorVertical,
          complete && styles.separatorComplete,
          variant === "prominent" && complete && styles.separatorProminentComplete,
          className
        )}
        {...props}
      />
    )
  }
)
StepperSeparator.displayName = "StepperSeparator"

export {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperTitle,
  StepperDescription,
  StepperSeparator,
}
