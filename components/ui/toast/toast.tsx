"use client"

import { Toaster as SonnerToaster, toast } from "sonner"
import type { ComponentProps } from "react"
import styles from "./toast.module.css"

function Toaster({ ...props }: ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster
      data-slot="toaster"
      position="bottom-right"
      className={styles.toaster}
      toastOptions={{
        classNames: {
          toast: styles.toast,
          title: styles.title,
          description: styles.description,
          actionButton: styles.actionButton,
          cancelButton: styles.cancelButton,
          closeButton: styles.closeButton,
        },
      }}
      {...props}
    />
  )
}
Toaster.displayName = "Toaster"

export { Toaster, toast }
