'use client';

import { MagnifyingGlass, EnvelopeSimple, User } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';

export function InputLeadingIconDemo() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        width: '100%',
        maxWidth: '20rem',
      }}
    >
      <Input
        leadingIcon={<MagnifyingGlass weight="bold" />}
        placeholder="Search products"
      />
      <Input
        leadingIcon={<EnvelopeSimple weight="bold" />}
        type="email"
        placeholder="you@example.com"
      />
      <Input leadingIcon={<User weight="bold" />} placeholder="Username" />
    </div>
  );
}
