'use client';

import { UsersIcon, ShieldIcon, EnvelopeIcon } from '@phosphor-icons/react';
import { SectionNav, SectionNavItem } from '@/components/ui/section-nav';

export function SectionNavDemo() {
  return (
    <SectionNav aria-label="Organization sections">
      <SectionNavItem href="#" icon={UsersIcon} label="Detail" isActive />
      <SectionNavItem href="#" icon={ShieldIcon} label="Roles" count={4} />
      <SectionNavItem href="#" icon={EnvelopeIcon} label="Invites" count={2} />
    </SectionNav>
  );
}
