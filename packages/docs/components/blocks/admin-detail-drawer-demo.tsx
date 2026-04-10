'use client';

import * as React from 'react';
import { AdminDetailDrawer } from '../../../../blocks/admin-detail-drawer/admin-detail-drawer';
import { Button } from '../../../../components/ui/button/button';
import { Input } from '../../../../components/ui/input/input';
import { Label } from '../../../../components/ui/label/label';

interface DemoUser {
  name: string;
  email: string;
  role: string;
}

const INITIAL_USER: DemoUser = {
  name: 'Jane Cooper',
  email: 'jane@acme.test',
  role: 'Admin',
};

export function AdminDetailDrawerDemo() {
  const [open, setOpen] = React.useState(false);
  const [user, setUser] = React.useState<DemoUser>(INITIAL_USER);
  const [draft, setDraft] = React.useState<DemoUser>(INITIAL_USER);

  const dirty =
    draft.name !== user.name ||
    draft.email !== user.email ||
    draft.role !== user.role;

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) {
        // Reset the draft to the latest committed values when opening.
        setDraft(user);
      }
    },
    [user]
  );

  const handleSave = React.useCallback(async () => {
    // Simulate an async save — 800ms then commit the draft.
    await new Promise<void>((resolve) => setTimeout(resolve, 800));
    setUser(draft);
  }, [draft]);

  const handleFieldChange = React.useCallback(
    (field: keyof DemoUser) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setDraft((prev) => ({ ...prev, [field]: value }));
      },
    []
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 'var(--spacing-4, 1rem)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-1, 0.25rem)',
          fontSize: 'var(--font-size-sm, 0.875rem)',
          color: 'var(--text-secondary, #6b7280)',
        }}
      >
        <div>
          <strong style={{ color: 'var(--text-primary, #111827)' }}>
            {user.name}
          </strong>{' '}
          — {user.email}
        </div>
        <div>Role: {user.role}</div>
      </div>

      <Button onClick={() => handleOpenChange(true)}>Edit user</Button>

      <AdminDetailDrawer
        open={open}
        onOpenChange={handleOpenChange}
        title="Edit user"
        description="Update the user's profile. Changes are saved asynchronously."
        dirty={dirty}
        onSave={handleSave}
        footerStatus={dirty ? 'Unsaved changes' : 'All changes saved'}
      >
        <form
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-4, 1rem)',
          }}
          onSubmit={(event) => event.preventDefault()}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-2, 0.5rem)',
            }}
          >
            <Label htmlFor="admin-detail-drawer-demo-name">Name</Label>
            <Input
              id="admin-detail-drawer-demo-name"
              value={draft.name}
              onChange={handleFieldChange('name')}
            />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-2, 0.5rem)',
            }}
          >
            <Label htmlFor="admin-detail-drawer-demo-email">Email</Label>
            <Input
              id="admin-detail-drawer-demo-email"
              type="email"
              value={draft.email}
              onChange={handleFieldChange('email')}
            />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-2, 0.5rem)',
            }}
          >
            <Label htmlFor="admin-detail-drawer-demo-role">Role</Label>
            <Input
              id="admin-detail-drawer-demo-role"
              value={draft.role}
              onChange={handleFieldChange('role')}
            />
          </div>
        </form>
      </AdminDetailDrawer>
    </div>
  );
}
