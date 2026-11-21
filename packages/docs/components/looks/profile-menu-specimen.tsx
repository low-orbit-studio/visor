'use client';

import { ProfileMenuTopBarDemo } from '@/components/blocks/profile-menu-demo';

/**
 * The five-look specimen (VI-802): the top bar's account menu, open. Not modal, so the open
 * menu leaves the rest of the frame (and its late-hydrating parts) visible to screen readers.
 */
export function ProfileMenuSpecimen() {
  return <ProfileMenuTopBarDemo defaultOpen modal={false} />;
}
