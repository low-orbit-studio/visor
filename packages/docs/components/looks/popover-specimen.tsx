'use client';

import { EnvelopeSimpleIcon, SignOutIcon, UserIcon } from '@phosphor-icons/react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import styles from './popover-specimen.module.css';

/**
 * The kit's account menu on a stay-mounted Popover (VI-808): it renders in place under
 * its button, fades in and out, and focus stays on the button. Solid unless an ancestor
 * sets `data-glass="on"`. The Help button is the next control in the tab order.
 */
export function PopoverStayMountedDemo({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <div className={styles.stage} data-demo="popover-stay-mounted">
      <div className={styles.bar}>
        <Popover defaultOpen={defaultOpen}>
          <PopoverTrigger asChild>
            <Button variant="glass" size="icon" aria-label="Your account">
              <UserIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent forceMount aria-label="Your account" className={styles.menu}>
            <div className={styles.who}>
              <strong>Sam Rivera</strong>
              <span>sam@example.com</span>
            </div>
            <Button variant="ghost" className={styles.item}>
              <EnvelopeSimpleIcon aria-hidden="true" /> Change Email
            </Button>
            <Button variant="ghost" className={styles.item}>
              <SignOutIcon aria-hidden="true" /> Sign Out
            </Button>
          </PopoverContent>
        </Popover>
        <Button variant="outline">Help</Button>
      </div>
    </div>
  );
}

/** The five-look specimen: the account menu, open. */
export function PopoverSpecimen() {
  return <PopoverStayMountedDemo defaultOpen />;
}
