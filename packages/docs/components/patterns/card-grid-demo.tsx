'use client';

import { ChartBar, Palette, ShieldCheck, Rocket, Users, Gear } from '@phosphor-icons/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

const CARDS = [
  {
    icon: <Rocket size={24} />,
    title: 'Fast to Ship',
    description: 'Copy components directly into your project with no lock-in or wrappers.',
  },
  {
    icon: <Palette size={24} />,
    title: 'Themeable',
    description: 'Every token is a CSS custom property — swap themes without touching components.',
  },
  {
    icon: <ShieldCheck size={24} />,
    title: 'Accessible',
    description: 'WCAG 2.1 AA compliant out of the box, built on Radix UI primitives.',
  },
  {
    icon: <ChartBar size={24} />,
    title: 'Analytics Ready',
    description: 'Built-in chart components make data visualization simple and consistent.',
  },
  {
    icon: <Users size={24} />,
    title: 'Team Friendly',
    description: 'Clear conventions and shared tokens keep design in sync across contributors.',
  },
  {
    icon: <Gear size={24} />,
    title: 'Configurable',
    description: 'Extend or override any component with full TypeScript and prop support.',
  },
];

export function CardGridDemo() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 'var(--spacing-4)',
        width: '100%',
        padding: 'var(--spacing-4)',
      }}
    >
      {CARDS.map((card) => (
        <Card key={card.title}>
          <CardHeader>
            <div
              style={{
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-2)',
              }}
            >
              {card.icon}
            </div>
            <CardTitle>{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>{card.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
