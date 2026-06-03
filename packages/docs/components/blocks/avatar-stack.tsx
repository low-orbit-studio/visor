'use client';

import * as React from 'react';
import { AvatarStack } from '../../../../components/ui/avatar/avatar';

export { AvatarStack } from '../../../../components/ui/avatar/avatar';
export type { AvatarStackProps } from '../../../../components/ui/avatar/avatar';

const DEMO_AVATARS_SHORT: (string | undefined)[] = [undefined, undefined, undefined];
const DEMO_AVATARS_FULL: (string | undefined)[] = [
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
];

export function AvatarStackSmallDemo() {
  return <AvatarStack avatars={DEMO_AVATARS_SHORT} total={3} size="sm" />;
}

export function AvatarStackMaxDemo() {
  return <AvatarStack avatars={DEMO_AVATARS_FULL} total={6} size="sm" />;
}

export function AvatarStackOverflowDemo() {
  return <AvatarStack avatars={DEMO_AVATARS_FULL} total={12} size="sm" />;
}

export function AvatarStackSizesDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <AvatarStack avatars={DEMO_AVATARS_FULL} total={9} size="sm" />
      <AvatarStack avatars={DEMO_AVATARS_FULL} total={9} size="default" />
      <AvatarStack avatars={DEMO_AVATARS_FULL} total={9} size="lg" />
    </div>
  );
}
