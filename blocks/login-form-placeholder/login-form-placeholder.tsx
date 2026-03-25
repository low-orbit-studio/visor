"use client"

import styles from "./login-form-placeholder.module.css"
import { cn } from "../../lib/utils"

interface LoginFormPlaceholderProps {
  className?: string
}

/**
 * Placeholder block for login form.
 * This is a minimal scaffold to prove the blocks pipeline end-to-end.
 * Replace with a real implementation in a future ticket.
 */
export function LoginFormPlaceholder({
  className,
}: LoginFormPlaceholderProps) {
  return (
    <div className={cn(styles.root, className)}>
      <div className={styles.header}>
        <h2 className={styles.title}>Sign in</h2>
        <p className={styles.description}>
          Enter your credentials to continue.
        </p>
      </div>
      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            className={styles.input}
            id="email"
            type="email"
            placeholder="you@example.com"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            className={styles.input}
            id="password"
            type="password"
            placeholder="••••••••"
          />
        </div>
        <button className={styles.button} type="submit">
          Sign in
        </button>
      </form>
    </div>
  )
}
