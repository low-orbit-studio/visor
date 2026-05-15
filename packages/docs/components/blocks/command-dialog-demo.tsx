'use client';

import * as React from 'react';
import {
  CalendarBlank,
  Copy,
  Database,
  Plus,
} from '@phosphor-icons/react';
import { CommandDialog } from '../../../../blocks/command-dialog/command-dialog';
import { Button } from '../../../../components/ui/button/button';
import { Kbd } from '../../../../components/ui/kbd/kbd';

const ICON_PROPS = { size: 14, weight: 'regular' as const };

export function CommandDialogDemo() {
  const [open, setOpen] = React.useState(false);

  const groups = [
    {
      id: 'events',
      heading: 'Events',
      count: 3,
      items: [
        {
          id: 'resolute-eris',
          value: 'Resolute presents Eris Drew',
          icon: <CalendarBlank {...ICON_PROPS} />,
          label: (
            <>
              Resolute pres. <span data-hit>Eris</span> Drew
            </>
          ),
          meta: 'Tonight · 22:00 · House of Yes',
          shortcut: '↵',
        },
        {
          id: 'nowadays-volvox',
          value: 'Nowadays Volvox b2b Eris',
          icon: <CalendarBlank {...ICON_PROPS} />,
          label: (
            <>
              Nowadays — Volvox b2b <span data-hit>Eris</span>
            </>
          ),
          meta: 'May 17 · 22:00 · Nowadays',
        },
        {
          id: 'sustain-release',
          value: 'Sustain-Release day 2 Eris Drew set',
          icon: <CalendarBlank {...ICON_PROPS} />,
          label: (
            <>
              Sustain-Release · day 2 (<span data-hit>Eris</span> Drew set)
            </>
          ),
          meta: 'Sept 14 · 16:00 · Camp Wapo',
        },
      ],
    },
    {
      id: 'guests',
      heading: 'Guests',
      count: 1,
      items: [
        {
          id: 'eris-drew-guest',
          value: 'Eris Drew',
          label: (
            <>
              <span data-hit>Eris</span> Drew
            </>
          ),
          meta: 'DJ · 12 events · last seen Apr 27',
        },
      ],
    },
    {
      id: 'actions',
      heading: 'Actions',
      items: [
        {
          id: 'new-event-eris',
          value: 'new event with eris drew',
          icon: <Plus {...ICON_PROPS} weight="bold" />,
          label: 'New event with Eris Drew',
          shortcut: 'N',
        },
        {
          id: 'copy-contact',
          value: 'copy artist contact',
          icon: <Copy {...ICON_PROPS} />,
          label: 'Copy artist contact',
          shortcut: '⌘C',
        },
        {
          id: 'rsvp-history',
          value: 'view eris rsvp history',
          icon: <Database {...ICON_PROPS} />,
          label: "View Eris's RSVP history",
        },
      ],
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 'var(--spacing-4, 1rem)',
      }}
    >
      <Button onClick={() => setOpen(true)}>
        Open palette&nbsp;&nbsp;
        <Kbd keys={['⌘', 'K']} size="sm" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        scope="Events"
        groups={groups}
        footerHints={[
          { keys: '↑↓', label: 'navigate' },
          { keys: '↵', label: 'open' },
          { keys: ['⌘', '↵'], label: 'open in tab' },
          { keys: 'tab', label: 'filter' },
        ]}
      />
    </div>
  );
}
