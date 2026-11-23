'use client';

import * as React from 'react';
import { AnimatedTitle, type AnimatedTitleAnimation } from '../../../../components/ui/animated-title/animated-title';
import { Button } from '@/components/ui/button';

const title: React.CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--font-size-3xl)',
  lineHeight: 'var(--line-height-tight)',
  color: 'var(--text-primary)',
};

const stack: React.CSSProperties = { display: 'grid', gap: 'var(--spacing-4)', justifyItems: 'start' };

/** One entrance with a Replay button: the title plays once on mount, so Replay remounts it. */
export function AnimatedTitleDemo({
  animation,
  text = 'Tell us about your weekend',
  delay,
}: {
  animation: AnimatedTitleAnimation;
  text?: string;
  delay?: number;
}) {
  const [run, setRun] = React.useState(0);
  return (
    <div style={stack} data-demo={`animated-title-${animation}`}>
      <AnimatedTitle key={run} style={title} animation={animation} text={text} delay={delay} />
      <Button variant="outline" size="sm" onClick={() => setRun((n) => n + 1)}>
        Replay
      </Button>
    </div>
  );
}

/** Held on its first frame until Play is pressed, as a timeline holds a day until it scrolls in. */
export function AnimatedTitleHoldDemo() {
  const [play, setPlay] = React.useState(false);
  const [run, setRun] = React.useState(0);
  return (
    <div style={stack} data-demo="animated-title-hold">
      <AnimatedTitle key={run} style={title} text="Saturday afternoon" play={play} />
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (play) setRun((n) => n + 1);
          setPlay(!play);
        }}
      >
        {play ? 'Reset' : 'Play'}
      </Button>
    </div>
  );
}

const dashes = (word: string) => word.replace(/-/g, '–');

/** `format` draws each word: here, hyphens become en dashes. */
export function AnimatedTitleFormatDemo() {
  const [run, setRun] = React.useState(0);
  return (
    <div style={stack} data-demo="animated-title-format">
      <AnimatedTitle key={run} style={title} text="Fri 6-9pm check-in" format={dashes} />
      <Button variant="outline" size="sm" onClick={() => setRun((n) => n + 1)}>
        Replay
      </Button>
    </div>
  );
}
