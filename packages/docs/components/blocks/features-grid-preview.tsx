'use client';

import { Rocket, Palette, ShieldCheck } from '@phosphor-icons/react';
import { FeaturesGrid } from './features-grid';

export function FeaturesGridPreview() {
  return (
    <FeaturesGrid
      heading="Why Visor?"
      description="A design system built for real projects — theme-agnostic, copy-and-own, and production-ready."
      features={[
        {
          icon: <Rocket size={24} />,
          title: 'Fast to Ship',
          description:
            'Copy components directly into your project. No lock-in, no wrappers, no magic.',
        },
        {
          icon: <Palette size={24} />,
          title: 'Themeable',
          description:
            'Every token is a CSS custom property. Swap themes without touching a single component.',
        },
        {
          icon: <ShieldCheck size={24} />,
          title: 'Accessible',
          description:
            'WCAG 2.1 AA compliant out of the box. Built on Radix UI primitives where it matters.',
        },
      ]}
    />
  );
}
