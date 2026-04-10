"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { PageHeader } from "../../components/ui/page-header/page-header"
import { Button } from "../../components/ui/button/button"
import { ConfirmDialog } from "../../components/ui/confirm-dialog/confirm-dialog"
import {
  Stepper,
  StepperDescription,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "../../components/ui/stepper/stepper"
import styles from "./admin-wizard.module.css"

export interface AdminWizardStep {
  /** Stable identifier for the step. */
  id: string
  /** Label rendered inside the stepper. */
  label: React.ReactNode
  /** Optional description rendered beneath the label in the stepper. */
  description?: React.ReactNode
  /** The step's main content. Only the active step's content is mounted. */
  content: React.ReactNode
  /**
   * Called when the user clicks Next on this step. Return false (or a
   * Promise that resolves to false) to block advancement.
   */
  validate?: () => boolean | Promise<boolean>
  /** Marks the step as optional — shown with an "Optional" hint in the stepper. */
  optional?: boolean
}

export interface AdminWizardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  // ── Header ──────────────────────────────────────────────────────────────
  /** Page title rendered inside the PageHeader. */
  title: React.ReactNode
  /** Optional eyebrow rendered above the title. */
  eyebrow?: React.ReactNode
  /** Optional supporting copy rendered below the title. */
  description?: React.ReactNode
  /** Optional breadcrumb node rendered above the title row. */
  breadcrumb?: React.ReactNode
  /** Optional header actions slot rendered on the right side of the header. */
  headerActions?: React.ReactNode

  // ── Steps ───────────────────────────────────────────────────────────────
  /** Ordered list of wizard steps. */
  steps: AdminWizardStep[]
  /** Controlled active step (0-based). */
  activeStep?: number
  /** Uncontrolled initial active step (0-based). Defaults to 0. */
  defaultActiveStep?: number
  /** Called when the active step changes. */
  onActiveStepChange?: (index: number) => void

  // ── Actions ─────────────────────────────────────────────────────────────
  /** Submit handler called when Next is pressed on the final step. Async-aware. */
  onSubmit?: () => void | Promise<void>
  /** Cancel handler. Protected by the unsaved-changes guard when `dirty` is true. */
  onCancel?: () => void

  // ── Labels ──────────────────────────────────────────────────────────────
  /** Back button label. Defaults to "Back". */
  backLabel?: React.ReactNode
  /** Next button label. Defaults to "Next". */
  nextLabel?: React.ReactNode
  /** Submit button label (final step). Defaults to "Submit". */
  submitLabel?: React.ReactNode
  /** Cancel button label. Defaults to "Cancel". */
  cancelLabel?: React.ReactNode

  // ── Stepper ─────────────────────────────────────────────────────────────
  /** Stepper orientation. Defaults to "horizontal". */
  stepperOrientation?: "horizontal" | "vertical"

  // ── Navigation ──────────────────────────────────────────────────────────
  /** Whether the Back button is shown and back navigation is allowed. Defaults to true. */
  allowBackNavigation?: boolean
  /**
   * Whether clicking a completed (or current) stepper item jumps to that step.
   * Defaults to true.
   */
  allowStepperClickNav?: boolean

  // ── State ───────────────────────────────────────────────────────────────
  /** Dirty flag — triggers the unsaved-changes guard on cancel. */
  dirty?: boolean
  /** Externally-controlled busy state. Overrides internal pending detection. */
  busy?: boolean

  // ── Unsaved guard (cancel) ──────────────────────────────────────────────
  /** Title of the unsaved-changes confirm dialog. */
  unsavedGuardTitle?: React.ReactNode
  /** Description of the unsaved-changes confirm dialog. */
  unsavedGuardDescription?: React.ReactNode
  /** Confirm (discard) label. Defaults to "Discard". */
  unsavedGuardConfirmLabel?: React.ReactNode
  /** Cancel (keep editing) label. Defaults to "Keep editing". */
  unsavedGuardCancelLabel?: React.ReactNode
}

const DEFAULT_UNSAVED_DESCRIPTION =
  "You have unsaved progress that will be lost if you cancel."

const AdminWizard = React.forwardRef<HTMLDivElement, AdminWizardProps>(
  function AdminWizard(
    {
      title,
      eyebrow,
      description,
      breadcrumb,
      headerActions,
      steps,
      activeStep: activeStepProp,
      defaultActiveStep = 0,
      onActiveStepChange,
      onSubmit,
      onCancel,
      backLabel = "Back",
      nextLabel = "Next",
      submitLabel = "Submit",
      cancelLabel = "Cancel",
      stepperOrientation = "horizontal",
      allowBackNavigation = true,
      allowStepperClickNav = true,
      dirty = false,
      busy,
      unsavedGuardTitle = "Discard progress?",
      unsavedGuardDescription = DEFAULT_UNSAVED_DESCRIPTION,
      unsavedGuardConfirmLabel = "Discard",
      unsavedGuardCancelLabel = "Keep editing",
      className,
      ...rest
    },
    ref
  ) {
    const isControlled = activeStepProp !== undefined
    const [internalStep, setInternalStep] = React.useState(defaultActiveStep)
    const currentStep = isControlled ? (activeStepProp as number) : internalStep

    const [validating, setValidating] = React.useState(false)
    const [submitting, setSubmitting] = React.useState(false)
    const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(
      () => new Set()
    )
    const [pendingCancel, setPendingCancel] = React.useState(false)

    const effectiveBusy = busy ?? submitting

    const setStep = React.useCallback(
      (next: number) => {
        if (!isControlled) setInternalStep(next)
        onActiveStepChange?.(next)
      },
      [isControlled, onActiveStepChange]
    )

    const step = steps[currentStep]
    const isLastStep = currentStep === steps.length - 1
    const isFirstStep = currentStep === 0

    const handleNextClick = React.useCallback(async () => {
      if (!step) return
      if (validating || effectiveBusy) return

      // Run per-step validation
      if (step.validate) {
        const result = step.validate()
        if (result && typeof (result as Promise<boolean>).then === "function") {
          setValidating(true)
          try {
            const ok = await (result as Promise<boolean>)
            setValidating(false)
            if (ok === false) return
          } catch {
            setValidating(false)
            return
          }
        } else if (result === false) {
          return
        }
      }

      // Mark current step complete
      setCompletedSteps((prev) => {
        const next = new Set(prev)
        next.add(currentStep)
        return next
      })

      if (isLastStep) {
        if (!onSubmit) return
        const result = onSubmit()
        if (result && typeof (result as Promise<void>).then === "function") {
          setSubmitting(true)
          try {
            await result
            setSubmitting(false)
          } catch (err) {
            setSubmitting(false)
            throw err
          }
        }
        return
      }

      setStep(currentStep + 1)
    }, [
      step,
      validating,
      effectiveBusy,
      isLastStep,
      onSubmit,
      currentStep,
      setStep,
    ])

    const handleBackClick = React.useCallback(() => {
      if (!allowBackNavigation) return
      if (validating || effectiveBusy) return
      if (isFirstStep) return
      setStep(currentStep - 1)
    }, [
      allowBackNavigation,
      validating,
      effectiveBusy,
      isFirstStep,
      currentStep,
      setStep,
    ])

    const handleCancelClick = React.useCallback(() => {
      if (effectiveBusy) return
      if (dirty) {
        setPendingCancel(true)
        return
      }
      onCancel?.()
    }, [dirty, effectiveBusy, onCancel])

    const handleGuardConfirm = React.useCallback(() => {
      if (pendingCancel) {
        setPendingCancel(false)
        onCancel?.()
      }
    }, [pendingCancel, onCancel])

    const handleGuardCancel = React.useCallback(() => {
      setPendingCancel(false)
    }, [])

    const handleStepperStepClick = React.useCallback(
      (target: number) => {
        if (!allowStepperClickNav) return
        if (validating || effectiveBusy) return
        if (target === currentStep) return

        if (target < currentStep) {
          if (!allowBackNavigation) return
          setStep(target)
          return
        }

        // Forward navigation — only allowed if every step between current and
        // target (exclusive of target, inclusive of current) has been completed.
        for (let i = currentStep; i < target; i += 1) {
          if (!completedSteps.has(i)) return
        }
        setStep(target)
      },
      [
        allowStepperClickNav,
        validating,
        effectiveBusy,
        currentStep,
        allowBackNavigation,
        completedSteps,
        setStep,
      ]
    )

    const stepLabelId = step ? `${step.id}-label` : undefined
    const nextIsSubmit = isLastStep
    const nextButtonLabel = nextIsSubmit ? submitLabel : nextLabel
    const nextDisabled =
      validating ||
      effectiveBusy ||
      (nextIsSubmit && !onSubmit) ||
      steps.length === 0
    const nextAriaBusy = validating || (nextIsSubmit && effectiveBusy)

    return (
      <>
        <div
          ref={ref}
          className={cn(
            styles.root,
            stepperOrientation === "vertical"
              ? styles.vertical
              : styles.horizontal,
            className
          )}
          data-slot="admin-wizard"
          data-orientation={stepperOrientation}
          {...rest}
        >
          <PageHeader
            className={styles.header}
            eyebrow={eyebrow}
            title={title}
            description={description}
            breadcrumb={breadcrumb}
            actions={headerActions}
          />

          <div className={styles.body}>
            <div
              className={styles.stepperWrap}
              data-slot="admin-wizard-stepper"
            >
              <Stepper
                activeStep={currentStep}
                orientation={stepperOrientation}
                className={styles.stepper}
              >
                {steps.map((s, index) => {
                  const status: "complete" | "active" | "upcoming" =
                    completedSteps.has(index) && index !== currentStep
                      ? "complete"
                      : index === currentStep
                        ? "active"
                        : index < currentStep
                          ? "complete"
                          : "upcoming"

                  const canJumpTo =
                    allowStepperClickNav &&
                    !validating &&
                    !effectiveBusy &&
                    (index < currentStep
                      ? allowBackNavigation
                      : index === currentStep
                        ? false
                        : (() => {
                            for (let i = currentStep; i < index; i += 1) {
                              if (!completedSteps.has(i)) return false
                            }
                            return true
                          })())

                  return (
                    <React.Fragment key={s.id}>
                      <StepperItem step={index} status={status}>
                        <StepperTrigger
                          step={index}
                          status={status}
                          disabled={!canJumpTo}
                          aria-label={
                            typeof s.label === "string"
                              ? `Go to step ${index + 1}: ${s.label}`
                              : `Go to step ${index + 1}`
                          }
                          onClick={() => handleStepperStepClick(index)}
                        />
                        <div className={styles.stepMeta}>
                          <StepperTitle id={`${s.id}-label`}>
                            {s.label}
                            {s.optional ? (
                              <span
                                className={styles.optional}
                                aria-hidden="true"
                              >
                                {" "}
                                (optional)
                              </span>
                            ) : null}
                          </StepperTitle>
                          {s.description ? (
                            <StepperDescription>
                              {s.description}
                            </StepperDescription>
                          ) : null}
                        </div>
                      </StepperItem>
                      {index < steps.length - 1 ? (
                        <StepperSeparator complete={status === "complete"} />
                      ) : null}
                    </React.Fragment>
                  )
                })}
              </Stepper>
            </div>

            <div
              className={styles.content}
              role="tabpanel"
              aria-labelledby={stepLabelId}
              data-slot="admin-wizard-content"
              data-step-id={step?.id}
            >
              {step?.content}
            </div>
          </div>

          <div
            className={styles.footer}
            role="group"
            aria-label="Wizard actions"
            data-slot="admin-wizard-footer"
          >
            <div className={styles.footerLeft}>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelClick}
                disabled={effectiveBusy || validating}
                data-slot="admin-wizard-cancel"
              >
                {cancelLabel}
              </Button>
            </div>
            <div className={styles.footerRight}>
              {allowBackNavigation ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackClick}
                  disabled={isFirstStep || validating || effectiveBusy}
                  data-slot="admin-wizard-back"
                >
                  {backLabel}
                </Button>
              ) : null}
              <Button
                type="button"
                onClick={handleNextClick}
                disabled={nextDisabled}
                aria-busy={nextAriaBusy || undefined}
                data-slot={
                  nextIsSubmit ? "admin-wizard-submit" : "admin-wizard-next"
                }
              >
                {nextButtonLabel}
              </Button>
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={pendingCancel}
          onOpenChange={(next) => {
            if (!next) handleGuardCancel()
          }}
          severity="warning"
          title={unsavedGuardTitle}
          description={unsavedGuardDescription}
          confirmLabel={unsavedGuardConfirmLabel}
          cancelLabel={unsavedGuardCancelLabel}
          onConfirm={handleGuardConfirm}
          onCancel={handleGuardCancel}
        />
      </>
    )
  }
)

AdminWizard.displayName = "AdminWizard"

export { AdminWizard }
