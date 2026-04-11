'use client';

import * as React from 'react';
import {
  AdminWizard,
  type AdminWizardStep,
} from '../../../../blocks/admin-wizard/admin-wizard';
import { Input } from '../../../../components/ui/input/input';
import { Label } from '../../../../components/ui/label/label';
import { Text } from '../../../../components/ui/text/text';

interface WizardDraft {
  name: string;
  description: string;
  category: string;
  visibility: string;
  template: string;
  notes: string;
}

const INITIAL_DRAFT: WizardDraft = {
  name: '',
  description: '',
  category: 'product',
  visibility: 'private',
  template: 'blank',
  notes: '',
};

const shellStyles: React.CSSProperties = {
  width: '100%',
  height: '36rem',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
  border: '1px solid var(--border-muted, #e5e7eb)',
  borderRadius: 'var(--radius-md, 0.5rem)',
};

const fieldStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-2, 0.5rem)',
};

const formStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-4, 1rem)',
  maxWidth: '28rem',
};

const reviewStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-2, 0.5rem)',
  padding: 'var(--spacing-4, 1rem)',
  border: '1px solid var(--border-muted, #e5e7eb)',
  borderRadius: 'var(--radius-md, 0.5rem)',
  backgroundColor: 'var(--surface-muted, #f9fafb)',
  maxWidth: '28rem',
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

export function AdminWizardDemo() {
  const [draft, setDraft] = React.useState<WizardDraft>(INITIAL_DRAFT);
  const [activeStep, setActiveStep] = React.useState(0);
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const dirty = React.useMemo(() => {
    return (Object.keys(draft) as Array<keyof WizardDraft>).some(
      (key) => draft[key] !== INITIAL_DRAFT[key]
    );
  }, [draft]);

  const handleChange = React.useCallback(
    (field: keyof WizardDraft) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setDraft((prev) => ({ ...prev, [field]: value }));
        if (field === 'name' && value.trim().length > 0) {
          setNameError(null);
        }
      },
    []
  );

  const validateBasics = React.useCallback(() => {
    if (draft.name.trim().length === 0) {
      setNameError('Name is required.');
      return false;
    }
    setNameError(null);
    return true;
  }, [draft.name]);

  const handleSubmit = React.useCallback(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 800));
    setDone(true);
  }, []);

  const handleCancel = React.useCallback(() => {
    setDraft(INITIAL_DRAFT);
    setActiveStep(0);
    setNameError(null);
    setDone(false);
  }, []);

  const handleReset = React.useCallback(() => {
    setDraft(INITIAL_DRAFT);
    setActiveStep(0);
    setNameError(null);
    setDone(false);
  }, []);

  const steps: AdminWizardStep[] = React.useMemo(
    () => [
      {
        id: 'basics',
        label: 'Basic info',
        description: 'Name and description',
        validate: validateBasics,
        content: (
          <div style={formStyles}>
            <div style={fieldStyles}>
              <Label htmlFor="wizard-name">Name</Label>
              <Input
                id="wizard-name"
                value={draft.name}
                onChange={handleChange('name')}
                placeholder="My new project"
                aria-invalid={nameError ? true : undefined}
              />
              {nameError ? (
                <span
                  style={{
                    fontSize: 'var(--font-size-sm, 0.875rem)',
                    color: 'var(--text-danger, #b91c1c)',
                  }}
                >
                  {nameError}
                </span>
              ) : null}
            </div>
            <div style={fieldStyles}>
              <Label htmlFor="wizard-description">Description</Label>
              <Input
                id="wizard-description"
                value={draft.description}
                onChange={handleChange('description')}
                placeholder="What is this project for?"
              />
            </div>
          </div>
        ),
      },
      {
        id: 'category',
        label: 'Select category',
        description: 'Pick a category and visibility',
        content: (
          <div style={formStyles}>
            <div style={fieldStyles}>
              <Label htmlFor="wizard-category">Category</Label>
              <Input
                id="wizard-category"
                value={draft.category}
                onChange={handleChange('category')}
              />
            </div>
            <div style={fieldStyles}>
              <Label htmlFor="wizard-visibility">Visibility</Label>
              <Input
                id="wizard-visibility"
                value={draft.visibility}
                onChange={handleChange('visibility')}
              />
            </div>
          </div>
        ),
      },
      {
        id: 'configure',
        label: 'Configure',
        description: 'Starter template and notes',
        optional: true,
        content: (
          <div style={formStyles}>
            <div style={fieldStyles}>
              <Label htmlFor="wizard-template">Template</Label>
              <Input
                id="wizard-template"
                value={draft.template}
                onChange={handleChange('template')}
              />
            </div>
            <div style={fieldStyles}>
              <Label htmlFor="wizard-notes">Notes</Label>
              <Input
                id="wizard-notes"
                value={draft.notes}
                onChange={handleChange('notes')}
                placeholder="Anything else?"
              />
            </div>
          </div>
        ),
      },
      {
        id: 'review',
        label: 'Review',
        description: 'Confirm and submit',
        content: done ? (
          <div style={doneStyles}>
            <Text size="lg" weight="semibold">
              Done!
            </Text>
            <Text size="sm" color="secondary">
              Your project &ldquo;{draft.name || 'Untitled'}&rdquo; was created.
            </Text>
            <button
              type="button"
              onClick={handleReset}
              style={{
                appearance: 'none',
                border: '1px solid var(--border-default, #d1d5db)',
                background: 'transparent',
                borderRadius: 'var(--radius-md, 0.5rem)',
                padding:
                  'var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem)',
                cursor: 'pointer',
                color: 'var(--text-primary, #111827)',
                fontSize: 'var(--font-size-sm, 0.875rem)',
              }}
            >
              Start over
            </button>
          </div>
        ) : (
          <div style={reviewStyles}>
            <Text size="sm">
              <strong>Name:</strong> {draft.name || '(empty)'}
            </Text>
            <Text size="sm">
              <strong>Description:</strong> {draft.description || '(empty)'}
            </Text>
            <Text size="sm">
              <strong>Category:</strong> {draft.category}
            </Text>
            <Text size="sm">
              <strong>Visibility:</strong> {draft.visibility}
            </Text>
            <Text size="sm">
              <strong>Template:</strong> {draft.template}
            </Text>
            <Text size="sm">
              <strong>Notes:</strong> {draft.notes || '(empty)'}
            </Text>
          </div>
        ),
      },
    ],
    [draft, handleChange, handleReset, nameError, validateBasics, done]
  );

  return (
    <div style={shellStyles}>
      <AdminWizard
        title="Create a project"
        eyebrow="New project"
        description="Walk through a few steps to spin up a fresh project."
        steps={steps}
        activeStep={activeStep}
        onActiveStepChange={setActiveStep}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        dirty={dirty && !done}
        submitLabel="Create project"
      />
    </div>
  );
}
