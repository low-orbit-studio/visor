'use client';

import * as React from 'react';
import {
  AdminSettingsPage,
  type AdminSettingsSection,
  type AdminSettingsSectionGroup,
} from '../../../../blocks/admin-settings-page/admin-settings-page';
import { Input } from '../../../../components/ui/input/input';
import { Label } from '../../../../components/ui/label/label';

interface WorkspaceSettings {
  workspaceName: string;
  slug: string;
  brandColor: string;
  logoUrl: string;
  teamSeats: string;
  defaultRole: string;
  githubOrg: string;
  slackChannel: string;
  deletePhrase: string;
}

const INITIAL_SETTINGS: WorkspaceSettings = {
  workspaceName: 'Acme Rocketry',
  slug: 'acme',
  brandColor: '#2563eb',
  logoUrl: 'https://cdn.acme.test/logo.svg',
  teamSeats: '25',
  defaultRole: 'member',
  githubOrg: 'acme-rocketry',
  slackChannel: '#eng',
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

const shellStyles: React.CSSProperties = {
  width: '100%',
  height: '32rem',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
  border: '1px solid var(--border-muted, #e5e7eb)',
  borderRadius: 'var(--radius-md, 0.5rem)',
};

export function AdminSettingsPageGlobalDemo() {
  const [saved, setSaved] = React.useState<WorkspaceSettings>(INITIAL_SETTINGS);
  const [draft, setDraft] = React.useState<WorkspaceSettings>(INITIAL_SETTINGS);

  const dirty = React.useMemo(() => {
    return (Object.keys(draft) as Array<keyof WorkspaceSettings>).some(
      (key) => draft[key] !== saved[key]
    );
  }, [draft, saved]);

  const handleChange = React.useCallback(
    (field: keyof WorkspaceSettings) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setDraft((prev) => ({ ...prev, [field]: value }));
      },
    []
  );

  const handleSave = React.useCallback(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 800));
    setSaved(draft);
  }, [draft]);

  const handleCancel = React.useCallback(() => {
    setDraft(saved);
  }, [saved]);

  const sections: AdminSettingsSection[] = React.useMemo(
    () => [
      {
        id: 'general',
        label: 'General',
        title: 'General',
        description: 'Basic information about your workspace.',
        content: (
          <div style={sectionStyles}>
            <div style={fieldStyles}>
              <Label htmlFor="settings-global-workspace-name">
                Workspace name
              </Label>
              <Input
                id="settings-global-workspace-name"
                value={draft.workspaceName}
                onChange={handleChange('workspaceName')}
              />
            </div>
            <div style={fieldStyles}>
              <Label htmlFor="settings-global-slug">URL slug</Label>
              <Input
                id="settings-global-slug"
                value={draft.slug}
                onChange={handleChange('slug')}
              />
            </div>
          </div>
        ),
      },
      {
        id: 'branding',
        label: 'Branding',
        title: 'Branding',
        description: 'Colors and assets used across the product.',
        content: (
          <div style={sectionStyles}>
            <div style={fieldStyles}>
              <Label htmlFor="settings-global-brand-color">Brand color</Label>
              <Input
                id="settings-global-brand-color"
                value={draft.brandColor}
                onChange={handleChange('brandColor')}
              />
            </div>
            <div style={fieldStyles}>
              <Label htmlFor="settings-global-logo-url">Logo URL</Label>
              <Input
                id="settings-global-logo-url"
                value={draft.logoUrl}
                onChange={handleChange('logoUrl')}
              />
            </div>
          </div>
        ),
      },
      {
        id: 'team',
        label: 'Team',
        title: 'Team',
        description: 'Seat counts and default permissions for new members.',
        content: (
          <div style={sectionStyles}>
            <div style={fieldStyles}>
              <Label htmlFor="settings-global-team-seats">Seats</Label>
              <Input
                id="settings-global-team-seats"
                type="number"
                value={draft.teamSeats}
                onChange={handleChange('teamSeats')}
              />
            </div>
            <div style={fieldStyles}>
              <Label htmlFor="settings-global-default-role">
                Default role
              </Label>
              <Input
                id="settings-global-default-role"
                value={draft.defaultRole}
                onChange={handleChange('defaultRole')}
              />
            </div>
          </div>
        ),
      },
      {
        id: 'integrations',
        label: 'Integrations',
        title: 'Integrations',
        description: 'Third-party services connected to this workspace.',
        content: (
          <div style={sectionStyles}>
            <div style={fieldStyles}>
              <Label htmlFor="settings-global-github">GitHub org</Label>
              <Input
                id="settings-global-github"
                value={draft.githubOrg}
                onChange={handleChange('githubOrg')}
              />
            </div>
            <div style={fieldStyles}>
              <Label htmlFor="settings-global-slack">Slack channel</Label>
              <Input
                id="settings-global-slack"
                value={draft.slackChannel}
                onChange={handleChange('slackChannel')}
              />
            </div>
          </div>
        ),
      },
      {
        id: 'danger',
        label: 'Danger zone',
        title: 'Danger zone',
        description:
          'Irreversible actions. Type "delete me" to arm the delete button.',
        content: (
          <div style={sectionStyles}>
            <div style={fieldStyles}>
              <Label htmlFor="settings-global-delete">
                Confirmation phrase
              </Label>
              <Input
                id="settings-global-delete"
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
    <div style={shellStyles}>
      <AdminSettingsPage
        title="Workspace settings"
        eyebrow="Acme Rocketry"
        description="Manage workspace-level configuration. All edits commit together."
        sections={sections}
        dirty={dirty}
        onSave={handleSave}
        onCancel={handleCancel}
        footerStatus={dirty ? 'Unsaved changes' : 'All changes saved'}
      />
    </div>
  );
}

export function AdminSettingsPageGroupedDemo() {
  const sectionGroups: AdminSettingsSectionGroup[] = [
    {
      label: 'Account',
      sections: [
        {
          id: 'grouped-profile',
          label: 'Profile',
          title: 'Profile',
          description: 'Your personal information and public presence.',
          content: (
            <div style={sectionStyles}>
              <div style={fieldStyles}>
                <label
                  htmlFor="grouped-display-name"
                  style={{ fontSize: 'var(--font-size-sm, 0.875rem)', fontWeight: 500 }}
                >
                  Display name
                </label>
                <input
                  id="grouped-display-name"
                  defaultValue="Ada Lovelace"
                  style={{
                    padding: 'var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem)',
                    border: '1px solid var(--border-default, #d1d5db)',
                    borderRadius: 'var(--radius-md, 0.5rem)',
                    fontSize: 'var(--font-size-sm, 0.875rem)',
                    background: 'var(--surface-input, #ffffff)',
                    color: 'var(--text-primary, #111827)',
                  }}
                />
              </div>
            </div>
          ),
        },
        {
          id: 'grouped-security',
          label: 'Security',
          title: 'Security',
          description: 'Password, two-factor authentication, and active sessions.',
          content: (
            <div style={sectionStyles}>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--text-secondary, #6b7280)' }}>
                Two-factor authentication is enabled.
              </p>
            </div>
          ),
        },
        {
          id: 'grouped-notifications',
          label: 'Notifications',
          title: 'Notifications',
          description: 'Email, push, and in-app notification preferences.',
          content: (
            <div style={sectionStyles}>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--text-secondary, #6b7280)' }}>
                You are subscribed to all notifications.
              </p>
            </div>
          ),
        },
        {
          id: 'grouped-tokens',
          label: 'Personal access',
          title: 'Personal access tokens',
          description: 'API tokens scoped to your user account.',
          content: (
            <div style={sectionStyles}>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--text-secondary, #6b7280)' }}>
                No personal access tokens yet.
              </p>
            </div>
          ),
        },
      ],
    },
    {
      label: 'Workspace',
      sections: [
        {
          id: 'grouped-general',
          label: 'General',
          title: 'General',
          description: 'Basic information about your workspace.',
          content: (
            <div style={sectionStyles}>
              <div style={fieldStyles}>
                <label
                  htmlFor="grouped-workspace-name"
                  style={{ fontSize: 'var(--font-size-sm, 0.875rem)', fontWeight: 500 }}
                >
                  Workspace name
                </label>
                <input
                  id="grouped-workspace-name"
                  defaultValue="Acme Rocketry"
                  style={{
                    padding: 'var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem)',
                    border: '1px solid var(--border-default, #d1d5db)',
                    borderRadius: 'var(--radius-md, 0.5rem)',
                    fontSize: 'var(--font-size-sm, 0.875rem)',
                    background: 'var(--surface-input, #ffffff)',
                    color: 'var(--text-primary, #111827)',
                  }}
                />
              </div>
            </div>
          ),
        },
        {
          id: 'grouped-members',
          label: 'Members',
          meta: '8',
          title: 'Members',
          description: 'Manage who has access to this workspace.',
          content: (
            <div style={sectionStyles}>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--text-secondary, #6b7280)' }}>
                8 members with access to this workspace.
              </p>
            </div>
          ),
        },
        {
          id: 'grouped-billing',
          label: 'Billing',
          title: 'Billing',
          description: 'Subscription plan and payment details.',
          content: (
            <div style={sectionStyles}>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--text-secondary, #6b7280)' }}>
                Pro plan · Renews Jan 1, 2027.
              </p>
            </div>
          ),
        },
        {
          id: 'grouped-integrations',
          label: 'Integrations',
          title: 'Integrations',
          description: 'Third-party services connected to this workspace.',
          content: (
            <div style={sectionStyles}>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--text-secondary, #6b7280)' }}>
                GitHub and Slack connected.
              </p>
            </div>
          ),
        },
        {
          id: 'grouped-api',
          label: 'API & webhooks',
          title: 'API & webhooks',
          description: 'Workspace API keys and outbound webhook endpoints.',
          content: (
            <div style={sectionStyles}>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--text-secondary, #6b7280)' }}>
                2 active API keys.
              </p>
            </div>
          ),
        },
        {
          id: 'grouped-audit',
          label: 'Audit log',
          title: 'Audit log',
          description: 'A tamper-evident record of all actions in this workspace.',
          content: (
            <div style={sectionStyles}>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--text-secondary, #6b7280)' }}>
                Showing the last 30 days of activity.
              </p>
            </div>
          ),
        },
      ],
    },
    {
      label: 'Venue',
      sections: [
        {
          id: 'grouped-venue-default',
          label: 'House of Yes',
          meta: 'default',
          title: 'House of Yes',
          description: 'Settings for the House of Yes venue.',
          content: (
            <div style={sectionStyles}>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--text-secondary, #6b7280)' }}>
                Default venue · Brooklyn, NY.
              </p>
            </div>
          ),
        },
        {
          id: 'grouped-venue-moodering',
          label: 'Mood Ring',
          title: 'Mood Ring',
          description: 'Settings for the Mood Ring venue.',
          content: (
            <div style={sectionStyles}>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--text-secondary, #6b7280)' }}>
                Brooklyn, NY.
              </p>
            </div>
          ),
        },
        {
          id: 'grouped-venue-add',
          label: '+ Add venue',
          muted: true,
          title: 'Add a venue',
          description: 'Connect another venue to your workspace.',
          content: (
            <div style={sectionStyles}>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--text-secondary, #6b7280)' }}>
                Add a new venue to manage its settings here.
              </p>
            </div>
          ),
        },
      ],
    },
  ];

  return (
    <div style={shellStyles}>
      <AdminSettingsPage
        title="Settings"
        eyebrow="Acme Rocketry"
        description="Account, workspace, and venue settings grouped by context."
        sectionGroups={sectionGroups}
        hideFooter
      />
    </div>
  );
}

export function AdminSettingsPagePerSectionDemo() {
  const [saved, setSaved] = React.useState<WorkspaceSettings>(INITIAL_SETTINGS);
  const [draft, setDraft] = React.useState<WorkspaceSettings>(INITIAL_SETTINGS);
  const [busyKey, setBusyKey] = React.useState<string | null>(null);

  const handleChange = React.useCallback(
    (field: keyof WorkspaceSettings) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setDraft((prev) => ({ ...prev, [field]: value }));
      },
    []
  );

  const isDirty = React.useCallback(
    (fields: Array<keyof WorkspaceSettings>) =>
      fields.some((f) => draft[f] !== saved[f]),
    [draft, saved]
  );

  const saveFields = React.useCallback(
    (key: string, fields: Array<keyof WorkspaceSettings>) => async () => {
      setBusyKey(key);
      await new Promise<void>((resolve) => setTimeout(resolve, 600));
      setSaved((prev) => {
        const next = { ...prev };
        fields.forEach((f) => {
          next[f] = draft[f];
        });
        return next;
      });
      setBusyKey(null);
    },
    [draft]
  );

  const revertFields = React.useCallback(
    (fields: Array<keyof WorkspaceSettings>) => () => {
      setDraft((prev) => {
        const next = { ...prev };
        fields.forEach((f) => {
          next[f] = saved[f];
        });
        return next;
      });
    },
    [saved]
  );

  const sections: AdminSettingsSection[] = React.useMemo(() => {
    const generalFields: Array<keyof WorkspaceSettings> = [
      'workspaceName',
      'slug',
    ];
    const brandingFields: Array<keyof WorkspaceSettings> = [
      'brandColor',
      'logoUrl',
    ];
    const integrationsFields: Array<keyof WorkspaceSettings> = [
      'githubOrg',
      'slackChannel',
    ];

    return [
      {
        id: 'general',
        label: 'General',
        title: 'General',
        description: 'Basic information about your workspace.',
        dirty: isDirty(generalFields),
        busy: busyKey === 'general',
        onSave: saveFields('general', generalFields),
        onRevert: revertFields(generalFields),
        content: (
          <div style={sectionStyles}>
            <div style={fieldStyles}>
              <Label htmlFor="settings-per-workspace-name">
                Workspace name
              </Label>
              <Input
                id="settings-per-workspace-name"
                value={draft.workspaceName}
                onChange={handleChange('workspaceName')}
              />
            </div>
            <div style={fieldStyles}>
              <Label htmlFor="settings-per-slug">URL slug</Label>
              <Input
                id="settings-per-slug"
                value={draft.slug}
                onChange={handleChange('slug')}
              />
            </div>
          </div>
        ),
      },
      {
        id: 'branding',
        label: 'Branding',
        title: 'Branding',
        description: 'Colors and assets used across the product.',
        dirty: isDirty(brandingFields),
        busy: busyKey === 'branding',
        onSave: saveFields('branding', brandingFields),
        onRevert: revertFields(brandingFields),
        content: (
          <div style={sectionStyles}>
            <div style={fieldStyles}>
              <Label htmlFor="settings-per-brand-color">Brand color</Label>
              <Input
                id="settings-per-brand-color"
                value={draft.brandColor}
                onChange={handleChange('brandColor')}
              />
            </div>
            <div style={fieldStyles}>
              <Label htmlFor="settings-per-logo-url">Logo URL</Label>
              <Input
                id="settings-per-logo-url"
                value={draft.logoUrl}
                onChange={handleChange('logoUrl')}
              />
            </div>
          </div>
        ),
      },
      {
        id: 'integrations',
        label: 'Integrations',
        title: 'Integrations',
        description: 'Third-party services connected to this workspace.',
        dirty: isDirty(integrationsFields),
        busy: busyKey === 'integrations',
        onSave: saveFields('integrations', integrationsFields),
        onRevert: revertFields(integrationsFields),
        content: (
          <div style={sectionStyles}>
            <div style={fieldStyles}>
              <Label htmlFor="settings-per-github">GitHub org</Label>
              <Input
                id="settings-per-github"
                value={draft.githubOrg}
                onChange={handleChange('githubOrg')}
              />
            </div>
            <div style={fieldStyles}>
              <Label htmlFor="settings-per-slack">Slack channel</Label>
              <Input
                id="settings-per-slack"
                value={draft.slackChannel}
                onChange={handleChange('slackChannel')}
              />
            </div>
          </div>
        ),
      },
    ];
  }, [draft, busyKey, handleChange, isDirty, saveFields, revertFields]);

  return (
    <div style={shellStyles}>
      <AdminSettingsPage
        title="Workspace settings"
        eyebrow="Acme Rocketry"
        description="Each section commits independently via its own save / revert row."
        sections={sections}
        perSectionSave
      />
    </div>
  );
}
