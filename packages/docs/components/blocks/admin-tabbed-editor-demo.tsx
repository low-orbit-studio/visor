'use client';

import * as React from 'react';
import {
  AdminTabbedEditor,
  type AdminTabbedEditorTab,
} from '../../../../blocks/admin-tabbed-editor/admin-tabbed-editor';
import { Input } from '../../../../components/ui/input/input';
import { Label } from '../../../../components/ui/label/label';

interface DemoProfile {
  displayName: string;
  handle: string;
  bio: string;
  email: string;
  emailNotifications: string;
  pushNotifications: string;
  deletePhrase: string;
}

const INITIAL_PROFILE: DemoProfile = {
  displayName: 'Jane Cooper',
  handle: 'jane',
  bio: 'Staff engineer working on billing infrastructure.',
  email: 'jane@acme.test',
  emailNotifications: 'weekly',
  pushNotifications: 'mentions',
  deletePhrase: '',
};

const fieldStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-2, 0.5rem)',
};

const sectionStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-4, 1rem)',
  maxWidth: '28rem',
};

export function AdminTabbedEditorDemo() {
  const [profile, setProfile] = React.useState<DemoProfile>(INITIAL_PROFILE);
  const [draft, setDraft] = React.useState<DemoProfile>(INITIAL_PROFILE);

  const dirty = React.useMemo(() => {
    return (Object.keys(draft) as Array<keyof DemoProfile>).some(
      (key) => draft[key] !== profile[key]
    );
  }, [draft, profile]);

  const handleChange = React.useCallback(
    (field: keyof DemoProfile) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setDraft((prev) => ({ ...prev, [field]: value }));
      },
    []
  );

  const handleSave = React.useCallback(async () => {
    // Simulate an async save — 800ms then commit the draft.
    await new Promise<void>((resolve) => setTimeout(resolve, 800));
    setProfile(draft);
  }, [draft]);

  const handleCancel = React.useCallback(() => {
    setDraft(profile);
  }, [profile]);

  const tabs: AdminTabbedEditorTab[] = React.useMemo(
    () => [
      {
        id: 'general',
        label: 'General',
        content: (
          <div style={sectionStyles}>
            <div style={fieldStyles}>
              <Label htmlFor="admin-tabbed-editor-demo-display-name">
                Display name
              </Label>
              <Input
                id="admin-tabbed-editor-demo-display-name"
                value={draft.displayName}
                onChange={handleChange('displayName')}
              />
            </div>
            <div style={fieldStyles}>
              <Label htmlFor="admin-tabbed-editor-demo-handle">Handle</Label>
              <Input
                id="admin-tabbed-editor-demo-handle"
                value={draft.handle}
                onChange={handleChange('handle')}
              />
            </div>
          </div>
        ),
      },
      {
        id: 'profile',
        label: 'Profile',
        content: (
          <div style={sectionStyles}>
            <div style={fieldStyles}>
              <Label htmlFor="admin-tabbed-editor-demo-bio">Bio</Label>
              <Input
                id="admin-tabbed-editor-demo-bio"
                value={draft.bio}
                onChange={handleChange('bio')}
              />
            </div>
            <div style={fieldStyles}>
              <Label htmlFor="admin-tabbed-editor-demo-email">Email</Label>
              <Input
                id="admin-tabbed-editor-demo-email"
                type="email"
                value={draft.email}
                onChange={handleChange('email')}
              />
            </div>
          </div>
        ),
      },
      {
        id: 'notifications',
        label: 'Notifications',
        content: (
          <div style={sectionStyles}>
            <div style={fieldStyles}>
              <Label htmlFor="admin-tabbed-editor-demo-email-notifications">
                Email frequency
              </Label>
              <Input
                id="admin-tabbed-editor-demo-email-notifications"
                value={draft.emailNotifications}
                onChange={handleChange('emailNotifications')}
              />
            </div>
            <div style={fieldStyles}>
              <Label htmlFor="admin-tabbed-editor-demo-push-notifications">
                Push alerts
              </Label>
              <Input
                id="admin-tabbed-editor-demo-push-notifications"
                value={draft.pushNotifications}
                onChange={handleChange('pushNotifications')}
              />
            </div>
          </div>
        ),
      },
      {
        id: 'danger',
        label: 'Danger zone',
        badge: (
          <span
            aria-hidden="true"
            style={{
              display: 'inline-block',
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-danger, #dc2626)',
            }}
          />
        ),
        content: (
          <div style={sectionStyles}>
            <p
              style={{
                margin: 0,
                fontSize: 'var(--font-size-sm, 0.875rem)',
                color: 'var(--text-secondary, #6b7280)',
              }}
            >
              Type <strong>delete me</strong> to arm the delete button.
            </p>
            <div style={fieldStyles}>
              <Label htmlFor="admin-tabbed-editor-demo-delete">
                Confirmation phrase
              </Label>
              <Input
                id="admin-tabbed-editor-demo-delete"
                value={draft.deletePhrase}
                onChange={handleChange('deletePhrase')}
              />
            </div>
          </div>
        ),
      },
    ],
    [draft, handleChange]
  );

  return (
    <div
      style={{
        width: '100%',
        height: '30rem',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        border: '1px solid var(--border-subtle, #e5e7eb)',
        borderRadius: 'var(--radius-md, 0.5rem)',
      }}
    >
      <AdminTabbedEditor
        title="Account settings"
        eyebrow="Profile"
        description="Update your account preferences. Switching tabs with unsaved edits opens the guard."
        tabs={tabs}
        dirty={dirty}
        onSave={handleSave}
        onCancel={handleCancel}
        footerStatus={dirty ? 'Unsaved changes' : 'All changes saved'}
      />
    </div>
  );
}
