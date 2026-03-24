"use client"

import * as React from "react"
import { Check } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./stepper.module.css"

/* ─── Context ──────────────────────────────────────────────────────────────── */

interface StepperContextValue {
  activeStep: number
  orientation: "horizontal" | "vertical"
}

const StepperContext = React.createContext<StepperContextValue>({
  activeStep: 0,
  orientation: "horizontal",
})

function useStepperContext() {
  return React.useContext(StepperContext)
}

/* ─── Stepper ──────────────────────────────────────────────────────────────── */

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  activeStep?: number
  orientation?: "horizontal" | "vertical"
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ className, activeStep = 0, orientation = "horizontal", children, ...props }, ref) => {
    const contextValue = React.useMemo(
      () => ({ activeStep, orientation }),
      [activeStep, orientation]
    )

    return (
      <StepperContext.Provider value={contextValue}>
        <div
          ref={ref}
          role="group"
          aria-label="Progress"
          data-slot="stepper"
          data-orientation={orientation}
          className={cn(
            styles.stepper,
            orientation === "vertical" && styles.stepperVertical,
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
  status?: "complete" | "active" | "upcoming"
}

const StepperItem = React.forwardRef<HTMLDivElement, StepperItemProps>(
  ({ className, step, status, children, ...props }, ref) => {
    const { activeStep, orientation } = useStepperContext()

    const resolvedStatus =
      status ?? (step < activeStep ? "complete" : step === activeStep ? "active" : "upcoming")

    return (
      <div
        ref={ref}
        data-slot="stepper-item"
        data-step={step}
        data-status={resolvedStatus}
        data-orientation={orientation}
        aria-current={resolvedStatus === "active" ? "step" : undefined}
        className={cn(
          styles.item,
          orientation === "vertical" && styles.itemVertical,
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
  status?: "complete" | "active" | "upcoming"
}

const StepperTrigger = React.forwardRef<HTMLButtonElement, StepperTriggerProps>(
  ({ className, step, status, children, ...props }, ref) => {
    const { activeStep } = useStepperContext()

    const resolvedStatus =
      status ?? (step < activeStep ? "complete" : step === activeStep ? "active" : "upcoming")

    return (
      <button
        ref={ref}
        type="button"
        data-slot="stepper-trigger"
        data-status={resolvedStatus}
        className={cn(
          styles.trigger,
          styles[`trigger--${resolvedStatus}`],
          className
        )}
        {...props}
      >
        {resolvedStatus === "complete" ? (
          <Check size={14} weight="bold" aria-hidden="true" />
        ) : (
          children ?? step + 1
        )}
        <span className={styles.srOnly}>
          {resolvedStatus === "complete" ? "Completed" : `Step ${step + 1}`}
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
    const { orientation } = useStepperContext()

    return (
      <div
        ref={ref}
        role="separator"
        data-slot="stepper-separator"
        data-orientation={orientation}
        data-complete={complete || undefined}
        className={cn(
          styles.separator,
          orientation === "vertical" && styles.separatorVertical,
          complete && styles.separatorComplete,
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
