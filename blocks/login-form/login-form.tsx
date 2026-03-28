"use client"

import { cn } from "../../lib/utils"
import { Button } from "../../components/ui/button/button"
import { Input } from "../../components/ui/input/input"
import { Label } from "../../components/ui/label/label"
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
        <div className={styles.field}>
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="you@example.com"
          />
        </div>
        <div className={styles.field}>
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
          />
        </div>
        <Button type="submit" className={styles.button}>
          Sign in
        </Button>
      </form>
    </Card>
  )
}
