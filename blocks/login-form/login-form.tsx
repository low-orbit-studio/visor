"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import { Button } from "../../components/ui/button/button"
import { Input } from "../../components/ui/input/input"
import { Field, FieldLabel } from "../../components/ui/field/field"
import { Card } from "../../components/ui/card/card"
import { Separator } from "../../components/ui/separator/separator"
import { Alert } from "../../components/ui/alert/alert"
import styles from "./login-form.module.css"

export interface OAuthProvider {
  /** Stable identifier passed to `onOAuthSignIn` (e.g. "google"). */
  id: string
  /** Button contents — text, or text alongside a caller-supplied icon. */
  label: React.ReactNode
  /** Optional leading icon. The block ships no provider assets. */
  icon?: React.ReactNode
}

export interface LoginFormProps {
  className?: string
  /** OAuth providers to render as outline buttons above the credentials form. */
  oauthProviders?: OAuthProvider[]
  /** Called with the provider `id` when its button is clicked. May be async. */
  onOAuthSignIn?: (id: string) => void | Promise<void>
  /** Label shown in the divider between OAuth and credentials. */
  dividerLabel?: React.ReactNode
  /** Error message rendered in a destructive Alert above the form. */
  error?: string | null
  /** Hide the email/password fields and submit button (OAuth-only flows). */
  hideCredentials?: boolean
}

export function LoginForm({
  className,
  oauthProviders,
  onOAuthSignIn,
  dividerLabel = "or continue with",
  error,
  hideCredentials = false,
}: LoginFormProps) {
  const [pendingId, setPendingId] = React.useState<string | null>(null)

  const hasOAuth = !!oauthProviders && oauthProviders.length > 0
  const showCredentials = !hideCredentials
  const showDivider = hasOAuth && showCredentials

  async function handleOAuth(id: string) {
    if (!onOAuthSignIn) return
    setPendingId(id)
    try {
      await onOAuthSignIn(id)
    } catch {
      // Errors surface to the user via the `error` prop, which the consumer
      // sets from its own catch. Swallow here so a rejected handler doesn't
      // become an unhandled promise rejection from this fire-and-forget click.
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Card className={cn(styles.root, className)}>
      <div className={styles.header}>
        <h2 className={styles.title}>Sign in</h2>
        <p className={styles.description}>
          Enter your credentials to continue.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive" className={styles.error}>
          {error}
        </Alert>
      ) : null}

      {hasOAuth ? (
        <div className={styles.oauthGroup}>
          {oauthProviders!.map((provider) => (
            <Button
              key={provider.id}
              type="button"
              variant="outline"
              className={styles.button}
              disabled={pendingId !== null}
              aria-busy={pendingId === provider.id}
              onClick={() => handleOAuth(provider.id)}
            >
              {provider.icon}
              {provider.label}
            </Button>
          ))}
        </div>
      ) : null}

      {showDivider ? (
        <div className={styles.divider}>
          <Separator />
          <span className={styles.dividerLabel}>{dividerLabel}</span>
          <Separator />
        </div>
      ) : null}

      {showCredentials ? (
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <Field>
            <FieldLabel htmlFor="login-email">Email</FieldLabel>
            <Input
              id="login-email"
              type="email"
              placeholder="you@example.com"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="login-password">Password</FieldLabel>
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
            />
          </Field>
          <Button type="submit" className={styles.button}>
            Sign in
          </Button>
        </form>
      ) : null}
    </Card>
  )
}
