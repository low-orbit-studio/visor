'use client';

import * as React from 'react';
import { FormError, FormErrorTitle, FormErrorDescription } from '../../../../components/ui/form-error/form-error';
import { Field, FieldLabel, FieldError } from '../../../../components/ui/field/field';
import { Input } from '../../../../components/ui/input/input';
import { WarningCircle, CheckCircle } from '@phosphor-icons/react';

/* ── Static banner — submit-error state ─────────────────────────────── */

export function FormErrorBannerDemo() {
  return (
    <div style={{ width: '100%', maxWidth: '28rem' }}>
      <FormError icon={<WarningCircle size={18} weight="fill" />}>
        <FormErrorTitle>Please fix the errors below before continuing</FormErrorTitle>
        <FormErrorDescription>2 fields need your attention.</FormErrorDescription>
      </FormError>
    </div>
  );
}

/* ── Minimal banner — title only ────────────────────────────────────── */

export function FormErrorMinimalDemo() {
  return (
    <div style={{ width: '100%', maxWidth: '28rem' }}>
      <FormError>
        <FormErrorTitle>Please fix the errors below before continuing</FormErrorTitle>
      </FormError>
    </div>
  );
}

/* ── Full validation pattern — field-level + submit-error banner ─────── */

export function FormValidationPatternDemo() {
  const [nameValue, setNameValue] = React.useState('');
  const [emailValue, setEmailValue] = React.useState('');
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);
  const [submitError, setSubmitError] = React.useState(false);

  const nameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);

  function validateName(value: string): string | null {
    if (!value.trim()) return 'Full name is required';
    return null;
  }

  function validateEmail(value: string): string | null {
    if (!value.trim()) return 'Email address is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ne = validateName(nameValue);
    const ee = validateEmail(emailValue);
    setNameError(ne);
    setEmailError(ee);

    if (ne || ee) {
      setSubmitError(true);
      // Focus first errored field
      if (ne) nameRef.current?.focus();
      else if (ee) emailRef.current?.focus();
      return;
    }

    setSubmitError(false);
    setSubmitted(true);
  }

  function handleReset() {
    setNameValue('');
    setEmailValue('');
    setNameError(null);
    setEmailError(null);
    setSubmitError(false);
    setSubmitted(false);
  }

  const errorCount = [nameError, emailError].filter(Boolean).length;

  if (submitted) {
    return (
      <div style={{ width: '100%', maxWidth: '28rem', padding: '1rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-success, #017231)' }}>
          <CheckCircle size={20} weight="fill" />
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Form submitted successfully!</span>
        </div>
        <button
          onClick={handleReset}
          style={{
            marginTop: '0.75rem',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
          }}
        >
          Reset demo
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{ width: '100%', maxWidth: '28rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      {submitError && (
        <FormError icon={<WarningCircle size={18} weight="fill" />}>
          <FormErrorTitle>Please fix the errors below before continuing</FormErrorTitle>
          {errorCount > 0 && (
            <FormErrorDescription>
              {errorCount} {errorCount === 1 ? 'field needs' : 'fields need'} your attention.
            </FormErrorDescription>
          )}
        </FormError>
      )}

      <Field>
        <FieldLabel htmlFor="demo-name">
          Full name <span aria-hidden="true" style={{ color: 'var(--destructive, #ef4444)', marginLeft: '2px' }}>*</span>
        </FieldLabel>
        <Input
          ref={nameRef}
          id="demo-name"
          type="text"
          placeholder="Alex Rivera"
          value={nameValue}
          aria-invalid={nameError ? 'true' : undefined}
          aria-describedby={nameError ? 'demo-name-error' : undefined}
          onChange={(e) => {
            setNameValue(e.target.value);
            if (nameError) setNameError(validateName(e.target.value));
          }}
          onBlur={() => setNameError(validateName(nameValue))}
        />
        {nameError && <FieldError id="demo-name-error">{nameError}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="demo-email">
          Email address <span aria-hidden="true" style={{ color: 'var(--destructive, #ef4444)', marginLeft: '2px' }}>*</span>
        </FieldLabel>
        <Input
          ref={emailRef}
          id="demo-email"
          type="email"
          placeholder="alex@example.com"
          value={emailValue}
          aria-invalid={emailError ? 'true' : undefined}
          aria-describedby={emailError ? 'demo-email-error' : undefined}
          onChange={(e) => {
            setEmailValue(e.target.value);
            if (emailError) setEmailError(validateEmail(e.target.value));
          }}
          onBlur={() => setEmailError(validateEmail(emailValue))}
        />
        {emailError && <FieldError id="demo-email-error">{emailError}</FieldError>}
      </Field>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button
          type="submit"
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--radius-md, 0.375rem)',
            border: 'none',
            background: 'var(--primary, #111827)',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Send invitation
        </button>
        <button
          type="button"
          onClick={handleReset}
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--radius-md, 0.375rem)',
            border: '1px solid var(--border-default, #e5e7eb)',
            background: 'transparent',
            color: 'var(--text-secondary, #6b7280)',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Reset
        </button>
      </div>
    </form>
  );
}
