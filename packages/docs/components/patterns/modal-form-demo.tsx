'use client';

import { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../../../../components/ui/dialog/dialog';
import { Field, FieldLabel } from '../../../../components/ui/field/field';
import { Input } from '../../../../components/ui/input/input';
import { Button } from '../../../../components/ui/button/button';

export function ModalFormDemo() {
  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add member</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
        </DialogHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          <Field>
            <FieldLabel htmlFor="modal-form-name">Name</FieldLabel>
            <Input id="modal-form-name" placeholder="Jane Smith" />
          </Field>
          <Field>
            <FieldLabel htmlFor="modal-form-email">Email</FieldLabel>
            <Input id="modal-form-email" type="email" placeholder="jane@example.com" />
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-4)' }}>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button>Send invite</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
