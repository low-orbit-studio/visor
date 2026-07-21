'use client';

import { useState } from 'react';
import {
  DialogForm,
  DialogFormTrigger,
  DialogFormClose,
  DialogFormContent,
  DialogFormHeader,
  DialogFormTitle,
  DialogFormBody,
  DialogFormFooter,
  DialogFormDescription,
} from '../../../../blocks/dialog-form/dialog-form';
import {
  DialogField,
  DialogFieldLabel,
  DialogFieldControl,
} from '../../../../blocks/dialog-field/dialog-field';
import { Button } from '../../../../components/ui/button/button';

export function DialogFormDemo() {
  const [open, setOpen] = useState(true);

  return (
    <DialogForm open={open} onOpenChange={setOpen}>
      <DialogFormTrigger asChild>
        <Button>Add artist</Button>
      </DialogFormTrigger>
      <DialogFormContent>
        <DialogFormHeader>
          <DialogFormTitle>Add artist</DialogFormTitle>
          <DialogFormDescription>
            Quick-add an artist to tonight&apos;s lineup.
          </DialogFormDescription>
        </DialogFormHeader>
        <DialogFormBody>
          <DialogField>
            <DialogFieldLabel htmlFor="dfd-name">ARTIST NAME</DialogFieldLabel>
            <DialogFieldControl>
              <input id="dfd-name" defaultValue="Aurora Halo" />
            </DialogFieldControl>
          </DialogField>
          <DialogField>
            <DialogFieldLabel htmlFor="dfd-time">SET TIME</DialogFieldLabel>
            <DialogFieldControl trailing={<span aria-hidden>▾</span>}>
              <input id="dfd-time" defaultValue="23:00" />
            </DialogFieldControl>
          </DialogField>
        </DialogFormBody>
        <DialogFormFooter>
          <DialogFormClose asChild>
            <Button size="dlg" variant="ghost">
              Cancel
            </Button>
          </DialogFormClose>
          <Button size="dlg">Add artist</Button>
        </DialogFormFooter>
      </DialogFormContent>
    </DialogForm>
  );
}
