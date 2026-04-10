'use client';

import { ConfirmDialog } from '../../../../components/ui/confirm-dialog/confirm-dialog';
import { Button } from '../../../../components/ui/button/button';

export function ConfirmDialogInfoDemo() {
  return (
    <ConfirmDialog
      trigger={<Button variant="outline">Archive project</Button>}
      severity="info"
      title="Archive project?"
      description="You can restore it from the archive at any time."
    />
  );
}

export function ConfirmDialogWarningDemo() {
  return (
    <ConfirmDialog
      trigger={<Button>Cancel subscription</Button>}
      severity="warning"
      title="Cancel subscription?"
      description="Your plan will end at the next billing cycle."
    />
  );
}

export function ConfirmDialogDangerDemo() {
  return (
    <ConfirmDialog
      trigger={<Button variant="destructive">Delete project</Button>}
      severity="danger"
      title="Delete project?"
      description="This action cannot be undone."
    />
  );
}

export function ConfirmDialogConfirmTextDemo() {
  return (
    <ConfirmDialog
      trigger={<Button variant="destructive">Delete acme</Button>}
      severity="danger"
      title="Delete project acme?"
      description="This will permanently delete the project and all associated data."
      confirmText="acme"
    />
  );
}

export function ConfirmDialogCustomBodyDemo() {
  return (
    <ConfirmDialog
      trigger={<Button>Revoke API key</Button>}
      severity="warning"
      title="Revoke API key?"
    >
      <p>Any services using this key will lose access immediately.</p>
      <ul>
        <li>Used by 3 services</li>
        <li>Created 4 months ago</li>
      </ul>
    </ConfirmDialog>
  );
}
