'use client';

import * as React from 'react';
import { AdminDetail } from '../../../../blocks/admin-detail/admin-detail';
import {
  Avatar,
  AvatarFallback,
} from '../../../../components/ui/avatar/avatar';
import { StatusBadge } from '../../../../components/ui/status-badge/status-badge';
import { Button } from '../../../../components/ui/button/button';

const BOOKINGS = [
  { id: 'BK-4821', date: 'Sat, Warehouse — Bushwick', fee: '$4,000', status: 'completed' as const },
  { id: 'BK-4790', date: 'Fri, Basement — Ridgewood', fee: '$3,200', status: 'completed' as const },
  { id: 'BK-4844', date: 'Sat, Main Room — Brooklyn', fee: '$4,500', status: 'scheduled' as const },
];

export function AdminDetailDemo() {
  return (
    <AdminDetail
      breadcrumb={
        <span
          style={{
            fontSize: 'var(--font-size-sm, 0.875rem)',
            color: 'var(--text-tertiary, #6b7280)',
          }}
        >
          Artists / Nadia Reyes
        </span>
      }
      eyebrow="Artist"
      title="Nadia Reyes"
      subtitle="Techno · Berlin / New York · Booking via Animal"
      status="active"
      media={
        <Avatar size="lg">
          <AvatarFallback>NR</AvatarFallback>
        </Avatar>
      }
      actions={
        <>
          <Button variant="outline" size="sm">
            Message
          </Button>
          <Button size="sm">Book</Button>
        </>
      }
      sections={[
        {
          id: 'profile',
          title: 'Profile',
          columns: 2,
          items: [
            { label: 'Legal name', value: 'Nadia Reyes' },
            { label: 'Agency', value: 'Animal Bookings' },
            { label: 'Home base', value: 'Brooklyn, NY' },
            {
              label: 'Availability',
              value: <StatusBadge status="active" label="Booking" />,
            },
          ],
        },
        {
          id: 'terms',
          title: 'Booking terms',
          description: 'Standard engagement rates and rider requirements.',
          columns: 2,
          items: [
            { label: 'Base fee', value: '$4,500', hint: 'per set' },
            { label: 'Set length', value: '2 hours' },
            { label: 'Travel buyout', value: '$1,200' },
            { label: 'Deposit', value: '50%', hint: 'on signing' },
          ],
        },
      ]}
      sensitive={{
        id: 'tax',
        eyebrow: 'Confidential',
        title: 'Tax & banking',
        description: 'W-9 and payout details. Revealed only when needed.',
        columns: 2,
        hiddenNote: 'W-9 and banking details are hidden for privacy.',
        items: [
          { label: 'Tax ID (EIN)', value: '**-***4821' },
          { label: 'W-9 status', value: <StatusBadge status="complete" label="On file" /> },
          { label: 'Payout method', value: 'ACH · Chase ****2210' },
          { label: 'Routing', value: '021******' },
        ],
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-4, 1rem)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 'var(--font-size-lg, 1.125rem)',
            fontWeight: 'var(--font-weight-semibold, 600)',
            color: 'var(--text-primary, #111827)',
          }}
        >
          Booking history
        </h2>
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-2, 0.5rem)',
          }}
        >
          {BOOKINGS.map((booking) => (
            <li
              key={booking.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--spacing-3, 0.75rem)',
                padding: 'var(--spacing-3, 0.75rem) var(--spacing-4, 1rem)',
                border:
                  'var(--stroke-width-thin, 1px) solid var(--border-muted, #e5e7eb)',
                borderRadius: 'var(--radius-md, 0.5rem)',
                fontSize: 'var(--font-size-sm, 0.875rem)',
                color: 'var(--text-secondary, #6b7280)',
              }}
            >
              <span style={{ color: 'var(--text-primary, #111827)' }}>
                {booking.date}
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-3, 0.75rem)',
                }}
              >
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {booking.fee}
                </span>
                <StatusBadge status={booking.status} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </AdminDetail>
  );
}
