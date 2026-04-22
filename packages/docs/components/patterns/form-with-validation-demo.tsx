'use client';

import { useState } from 'react';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
}

export function FormWithValidationDemo() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function validate(): FormErrors {
    const next: FormErrors = {};

    if (!fullName.trim()) {
      next.fullName = 'Full name is required.';
    }

    if (!email.trim()) {
      next.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = 'Please enter a valid email address.';
    }

    if (!password) {
      next.password = 'Password is required.';
    } else if (password.length < 8) {
      next.password = 'Password must be at least 8 characters.';
    }

    return next;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length === 0) {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--spacing-3)',
          padding: 'var(--spacing-8)',
          textAlign: 'center',
          color: 'var(--text-primary)',
        }}
      >
        <p style={{ fontWeight: 600 }}>Account created!</p>
        <Button
          variant="outline"
          onClick={() => {
            setFullName('');
            setEmail('');
            setPassword('');
            setErrors({});
            setSubmitted(false);
          }}
        >
          Reset demo
        </Button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 400,
        margin: '0 auto',
        padding: 'var(--spacing-6)',
      }}
    >
      <form onSubmit={handleSubmit} noValidate aria-label="Create account">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <Field>
            <FieldLabel htmlFor="fwv-full-name">Full Name</FieldLabel>
            <Input
              id="fwv-full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'fwv-full-name-error' : undefined}
              placeholder="Jane Smith"
            />
            {errors.fullName && (
              <FieldError id="fwv-full-name-error" errors={[errors.fullName]} />
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="fwv-email">Email</FieldLabel>
            <Input
              id="fwv-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'fwv-email-error' : undefined}
              placeholder="jane@example.com"
            />
            {errors.email && (
              <FieldError id="fwv-email-error" errors={[errors.email]} />
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="fwv-password">Password</FieldLabel>
            <Input
              id="fwv-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'fwv-password-error' : undefined}
              placeholder="Min. 8 characters"
            />
            {errors.password && (
              <FieldError id="fwv-password-error" errors={[errors.password]} />
            )}
          </Field>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-2)' }}>
            <Button type="submit">Create account</Button>
            <p
              style={{
                textAlign: 'center',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              Already have an account?
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
