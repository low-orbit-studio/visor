"use client"

import { cn } from "../../lib/utils"
import { Button } from "../../components/ui/button/button"
import { Input } from "../../components/ui/input/input"
import { Field, FieldLabel } from "../../components/ui/field/field"
import { Card } from "../../components/ui/card/card"
import styles from "./login-form.module.css"

interface LoginFormProps {
  className?: string
}

export function LoginForm({
  className,
}: LoginFormProps) {
  return (
    <Card className={cn(styles.root, className)}>
      <div className={styles.header}>
        <h2 className={styles.title}>Sign in</h2>
        <p className={styles.description}>
          Enter your credentials to continue.
        </p>
      </div>
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
    </Card>
  )
}
