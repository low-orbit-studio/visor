'use client';

import * as React from 'react';
import { EyeSlashIcon, GlobeIcon, KeyIcon, SealCheckIcon, UserIcon } from '@phosphor-icons/react';
import { ReachRings } from '../../../../components/ui/reach-rings/reach-rings';
import { RadioGroup, RadioGroupItem } from '../../../../components/ui/radio-group/radio-group';

const LEVELS = [
  { value: 'you', title: 'Just You', icon: <EyeSlashIcon /> },
  { value: 'industry', title: 'Industry Only', icon: <KeyIcon /> },
  { value: 'verified', title: 'Verified Bookers', icon: <SealCheckIcon /> },
  { value: 'everyone', title: 'Everyone', icon: <GlobeIcon /> },
];

/** The stepped picker drives the rings: the index of the chosen level is the reach. */
export function ReachPickerDemo({ size = 'default' }: { size?: 'default' | 'compact' }) {
  const [value, setValue] = React.useState('verified');
  const reach = LEVELS.findIndex((l) => l.value === value);
  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: '1.5rem', width: '100%', maxWidth: size === 'compact' ? '22rem' : '30rem' }}>
      <ReachRings levels={LEVELS.length} value={reach} size={size} icon={<UserIcon />} />
      <RadioGroup variant="stepped" size={size} aria-label="Who can see" value={value} onValueChange={setValue} style={{ width: '100%' }}>
        {LEVELS.map((l) => (
          <RadioGroupItem key={l.value} value={l.value} icon={l.icon} title={l.title} />
        ))}
      </RadioGroup>
    </div>
  );
}

export function ReachRingsLevelsDemo() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center' }}>
      {[0, 1, 2, 3].map((v) => (
        <ReachRings key={v} levels={4} value={v} size="compact" icon={<UserIcon />} />
      ))}
    </div>
  );
}

export function SteppedDisabledDemo() {
  return (
    <RadioGroup variant="stepped" aria-label="Who can see" defaultValue="industry" style={{ width: '100%', maxWidth: '30rem' }}>
      {LEVELS.map((l) => (
        <RadioGroupItem key={l.value} value={l.value} icon={l.icon} title={l.title} disabled={l.value === 'verified'} />
      ))}
    </RadioGroup>
  );
}
