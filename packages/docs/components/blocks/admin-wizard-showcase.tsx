'use client';

import * as React from 'react';
import {
  AdminWizard,
  type AdminWizardStep,
} from '../../../../blocks/admin-wizard/admin-wizard';
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '../../../../components/ui/field/field';
import { Input } from '../../../../components/ui/input/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select/select';
import { Button } from '../../../../components/ui/button/button';
import { Text } from '../../../../components/ui/text/text';

/**
 * ENTR-style create-org wizard showcase.
 *
 * Editorial-density hardening pass for admin-wizard. Composes the block
 * against a 4-step admin onboarding pattern (Organization → Workspace →
 * Team → Confirm) using Field family primitives, Input, Select, and the
 * block's stepper / validation / submit / dirty-guard surface.
 *
 * No r3 reference — composition is built against the inferred block API.
 */

const PLAN_TIERS = [
  { value: 'starter', label: 'Starter — Free' },
  { value: 'growth', label: 'Growth — $49/mo' },
  { value: 'scale', label: 'Scale — $199/mo' },
  { value: 'enterprise', label: 'Enterprise — Contact sales' },
];

const TIMEZONES = [
  { value: 'America/New_York', label: '(GMT-05:00) Eastern — New York' },
  { value: 'America/Los_Angeles', label: '(GMT-08:00) Pacific — Los Angeles' },
  { value: 'Europe/London', label: '(GMT+00:00) GMT — London' },
  { value: 'Europe/Berlin', label: '(GMT+01:00) CET — Berlin' },
  { value: 'Asia/Tokyo', label: '(GMT+09:00) JST — Tokyo' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
];

const LOCALES = [
  { value: 'en-US', label: 'English (United States)' },
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'de-DE', label: 'Deutsch (Deutschland)' },
  { value: 'ja-JP', label: '日本語 (日本)' },
];

const TEAM_ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
];

interface Invite {
  id: string;
  email: string;
  role: string;
}

interface Draft {
  orgName: string;
  orgSlug: string;
  planTier: string;
  timezone: string;
  currency: string;
  locale: string;
  invites: Invite[];
}

const INITIAL_DRAFT: Draft = {
  orgName: '',
  orgSlug: '',
  planTier: 'growth',
  timezone: 'America/New_York',
  currency: 'USD',
  locale: 'en-US',
  invites: [
    { id: 'invite-1', email: '', role: 'admin' },
    { id: 'invite-2', email: '', role: 'member' },
  ],
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const labelFor = (
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string
) => options.find((option) => option.value === value)?.label ?? value;

interface FieldErrors {
  orgName?: string;
  orgSlug?: string;
  invites?: Record<string, string>;
}

const shellStyles: React.CSSProperties = {
  width: '100%',
  minHeight: '42rem',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
  border: '1px solid var(--border-muted, #e5e7eb)',
  borderRadius: 'var(--radius-md, 0.5rem)',
  background: 'var(--surface-default, #ffffff)',
};

const formStyles: React.CSSProperties = {
  display: 'grid',
  gap: 'var(--spacing-5, 1.25rem)',
  maxWidth: '36rem',
};

const rowStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 'var(--spacing-4, 1rem)',
};

const inviteRowStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 12rem auto',
  gap: 'var(--spacing-3, 0.75rem)',
  alignItems: 'end',
};

const reviewCardStyles: React.CSSProperties = {
  display: 'grid',
  gap: 'var(--spacing-4, 1rem)',
  padding: 'var(--spacing-5, 1.25rem)',
  border: '1px solid var(--border-muted, #e5e7eb)',
  borderRadius: 'var(--radius-md, 0.5rem)',
  background: 'var(--surface-muted, #f9fafb)',
  maxWidth: '36rem',
};

const reviewRowStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '12rem 1fr',
  gap: 'var(--spacing-3, 0.75rem)',
  alignItems: 'baseline',
};

const doneStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--spacing-3, 0.75rem)',
  padding: 'var(--spacing-8, 2rem)',
  textAlign: 'center',
};

export function AdminWizardShowcase() {
  const [draft, setDraft] = React.useState<Draft>(INITIAL_DRAFT);
  const [activeStep, setActiveStep] = React.useState(0);
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [done, setDone] = React.useState(false);

  const dirty = React.useMemo(() => {
    if (done) return false;
    if (draft.orgName !== INITIAL_DRAFT.orgName) return true;
    if (draft.orgSlug !== INITIAL_DRAFT.orgSlug) return true;
    if (draft.planTier !== INITIAL_DRAFT.planTier) return true;
    if (draft.timezone !== INITIAL_DRAFT.timezone) return true;
    if (draft.currency !== INITIAL_DRAFT.currency) return true;
    if (draft.locale !== INITIAL_DRAFT.locale) return true;
    return draft.invites.some((invite) => invite.email.trim().length > 0);
  }, [draft, done]);

  const handleNameChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setDraft((prev) => ({
        ...prev,
        orgName: value,
        orgSlug: slugTouched ? prev.orgSlug : slugify(value),
      }));
      if (value.trim().length > 0) {
        setErrors((prev) => ({ ...prev, orgName: undefined }));
      }
    },
    [slugTouched]
  );

  const handleSlugChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSlugTouched(true);
      setDraft((prev) => ({ ...prev, orgSlug: value }));
      if (/^[a-z0-9-]+$/.test(value)) {
        setErrors((prev) => ({ ...prev, orgSlug: undefined }));
      }
    },
    []
  );

  const handleSelect = React.useCallback(
    (field: keyof Pick<Draft, 'planTier' | 'timezone' | 'currency' | 'locale'>) =>
      (value: string) => {
        setDraft((prev) => ({ ...prev, [field]: value }));
      },
    []
  );

  const handleInviteChange = React.useCallback(
    (id: string, patch: Partial<Invite>) => {
      setDraft((prev) => ({
        ...prev,
        invites: prev.invites.map((invite) =>
          invite.id === id ? { ...invite, ...patch } : invite
        ),
      }));
      if (patch.email !== undefined) {
        setErrors((prev) => {
          const next = { ...prev.invites };
          delete next[id];
          return { ...prev, invites: next };
        });
      }
    },
    []
  );

  const handleAddInvite = React.useCallback(() => {
    setDraft((prev) => ({
      ...prev,
      invites: [
        ...prev.invites,
        {
          id: `invite-${Date.now()}`,
          email: '',
          role: 'member',
        },
      ],
    }));
  }, []);

  const handleRemoveInvite = React.useCallback((id: string) => {
    setDraft((prev) => ({
      ...prev,
      invites: prev.invites.filter((invite) => invite.id !== id),
    }));
    setErrors((prev) => {
      const next = { ...prev.invites };
      delete next[id];
      return { ...prev, invites: next };
    });
  }, []);

  const validateOrgStep = React.useCallback(() => {
    const next: FieldErrors = {};
    if (draft.orgName.trim().length === 0) {
      next.orgName = 'Organization name is required.';
    }
    if (draft.orgSlug.trim().length === 0) {
      next.orgSlug = 'Slug is required.';
    } else if (!/^[a-z0-9-]+$/.test(draft.orgSlug)) {
      next.orgSlug =
        'Slug must contain only lowercase letters, numbers, and hyphens.';
    }
    setErrors((prev) => ({ ...prev, ...next }));
    return Object.keys(next).length === 0;
  }, [draft.orgName, draft.orgSlug]);

  const validateTeamStep = React.useCallback(() => {
    const inviteErrors: Record<string, string> = {};
    const nonEmpty = draft.invites.filter(
      (invite) => invite.email.trim().length > 0
    );
    for (const invite of nonEmpty) {
      if (!isValidEmail(invite.email)) {
        inviteErrors[invite.id] = 'Enter a valid email address.';
      }
    }
    setErrors((prev) => ({ ...prev, invites: inviteErrors }));
    return Object.keys(inviteErrors).length === 0;
  }, [draft.invites]);

  const handleSubmit = React.useCallback(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 800));
    setDone(true);
  }, []);

  const handleCancel = React.useCallback(() => {
    setDraft(INITIAL_DRAFT);
    setSlugTouched(false);
    setErrors({});
    setActiveStep(0);
    setDone(false);
  }, []);

  const validInvites = React.useMemo(
    () =>
      draft.invites.filter(
        (invite) =>
          invite.email.trim().length > 0 && isValidEmail(invite.email)
      ),
    [draft.invites]
  );

  const steps: AdminWizardStep[] = React.useMemo(
    () => [
      {
        id: 'organization',
        label: 'Organization',
        description: 'Name and plan',
        validate: validateOrgStep,
        content: (
          <div style={formStyles}>
            <Field>
              <FieldLabel htmlFor="org-name">Organization name</FieldLabel>
              <FieldDescription>
                The display name shown to members and on billing receipts.
              </FieldDescription>
              <Input
                id="org-name"
                value={draft.orgName}
                onChange={handleNameChange}
                placeholder="Acme, Inc."
                aria-invalid={errors.orgName ? true : undefined}
              />
              {errors.orgName ? <FieldError>{errors.orgName}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="org-slug">URL slug</FieldLabel>
              <FieldDescription>
                Used in your workspace URL — acme.entr.app/<strong>slug</strong>.
              </FieldDescription>
              <Input
                id="org-slug"
                value={draft.orgSlug}
                onChange={handleSlugChange}
                placeholder="acme"
                aria-invalid={errors.orgSlug ? true : undefined}
              />
              {errors.orgSlug ? <FieldError>{errors.orgSlug}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="plan-tier">Plan tier</FieldLabel>
              <FieldDescription>
                You can upgrade or downgrade later from billing settings.
              </FieldDescription>
              <Select
                value={draft.planTier}
                onValueChange={handleSelect('planTier')}
              >
                <SelectTrigger id="plan-tier">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_TIERS.map((tier) => (
                    <SelectItem key={tier.value} value={tier.value}>
                      {tier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        ),
      },
      {
        id: 'workspace',
        label: 'Workspace',
        description: 'Locale and formatting',
        content: (
          <div style={formStyles}>
            <Field>
              <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
              <FieldDescription>
                Used for scheduling, audit logs, and report windows.
              </FieldDescription>
              <Select
                value={draft.timezone}
                onValueChange={handleSelect('timezone')}
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div style={rowStyles}>
              <Field>
                <FieldLabel htmlFor="currency">Currency</FieldLabel>
                <Select
                  value={draft.currency}
                  onValueChange={handleSelect('currency')}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="locale">Locale</FieldLabel>
                <Select
                  value={draft.locale}
                  onValueChange={handleSelect('locale')}
                >
                  <SelectTrigger id="locale">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCALES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>
        ),
      },
      {
        id: 'team',
        label: 'Team',
        description: 'Invite members',
        optional: true,
        validate: validateTeamStep,
        content: (
          <div style={formStyles}>
            <Text size="sm" color="secondary">
              Invite teammates by email. Empty rows are skipped on submit.
            </Text>
            {draft.invites.map((invite, index) => {
              const inviteError = errors.invites?.[invite.id];
              return (
                <div key={invite.id} style={inviteRowStyles}>
                  <Field>
                    <FieldLabel htmlFor={`invite-email-${invite.id}`}>
                      Email {index + 1}
                    </FieldLabel>
                    <Input
                      id={`invite-email-${invite.id}`}
                      type="email"
                      value={invite.email}
                      onChange={(event) =>
                        handleInviteChange(invite.id, {
                          email: event.target.value,
                        })
                      }
                      placeholder="teammate@acme.com"
                      aria-invalid={inviteError ? true : undefined}
                    />
                    {inviteError ? (
                      <FieldError>{inviteError}</FieldError>
                    ) : null}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`invite-role-${invite.id}`}>
                      Role
                    </FieldLabel>
                    <Select
                      value={invite.role}
                      onValueChange={(value) =>
                        handleInviteChange(invite.id, { role: value })
                      }
                    >
                      <SelectTrigger id={`invite-role-${invite.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAM_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveInvite(invite.id)}
                    disabled={draft.invites.length <= 1}
                    aria-label={`Remove invite ${index + 1}`}
                  >
                    Remove
                  </Button>
                </div>
              );
            })}
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddInvite}
              >
                Add another invite
              </Button>
            </div>
          </div>
        ),
      },
      {
        id: 'confirm',
        label: 'Confirm',
        description: 'Review and create',
        content: done ? (
          <div style={doneStyles}>
            <Text size="lg" weight="semibold">
              Organization created
            </Text>
            <Text size="sm" color="secondary">
              {draft.orgName} is live at {draft.orgSlug}.entr.app
            </Text>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Start over
            </Button>
          </div>
        ) : (
          <div style={reviewCardStyles}>
            <div style={reviewRowStyles}>
              <Text size="sm" weight="medium" color="secondary">
                Organization
              </Text>
              <Text size="sm">{draft.orgName || '—'}</Text>
            </div>
            <div style={reviewRowStyles}>
              <Text size="sm" weight="medium" color="secondary">
                URL
              </Text>
              <Text size="sm">
                {draft.orgSlug ? `${draft.orgSlug}.entr.app` : '—'}
              </Text>
            </div>
            <div style={reviewRowStyles}>
              <Text size="sm" weight="medium" color="secondary">
                Plan
              </Text>
              <Text size="sm">{labelFor(PLAN_TIERS, draft.planTier)}</Text>
            </div>
            <div style={reviewRowStyles}>
              <Text size="sm" weight="medium" color="secondary">
                Timezone
              </Text>
              <Text size="sm">{labelFor(TIMEZONES, draft.timezone)}</Text>
            </div>
            <div style={reviewRowStyles}>
              <Text size="sm" weight="medium" color="secondary">
                Currency / Locale
              </Text>
              <Text size="sm">
                {labelFor(CURRENCIES, draft.currency)} ·{' '}
                {labelFor(LOCALES, draft.locale)}
              </Text>
            </div>
            <div style={reviewRowStyles}>
              <Text size="sm" weight="medium" color="secondary">
                Invites
              </Text>
              <Text size="sm">
                {validInvites.length > 0
                  ? `${validInvites.length} member${validInvites.length === 1 ? '' : 's'} will receive invitations`
                  : 'No invites — you can add members later'}
              </Text>
            </div>
          </div>
        ),
      },
    ],
    [
      draft,
      errors,
      handleAddInvite,
      handleCancel,
      handleInviteChange,
      handleNameChange,
      handleRemoveInvite,
      handleSelect,
      handleSlugChange,
      validateOrgStep,
      validateTeamStep,
      validInvites.length,
      done,
    ]
  );

  return (
    <div style={shellStyles}>
      <AdminWizard
        title="Create an organization"
        eyebrow="New workspace"
        description="Set up your organization, configure workspace defaults, and invite your team."
        steps={steps}
        activeStep={activeStep}
        onActiveStepChange={setActiveStep}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        dirty={dirty}
        submitLabel="Create organization"
        stepperOrientation="horizontal"
        allowBackNavigation
        allowStepperClickNav
        unsavedGuardTitle="Discard new organization?"
        unsavedGuardDescription="Your draft organization details will be lost if you cancel now."
        unsavedGuardConfirmLabel="Discard"
        unsavedGuardCancelLabel="Keep editing"
      />
    </div>
  );
}
