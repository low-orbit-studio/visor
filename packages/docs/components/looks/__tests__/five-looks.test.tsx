import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { FiveLooks } from '../five-looks';
import { LOOK_SPECIMENS } from '../specimens';

const srcs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('iframe')).map((f) => new URL(f.getAttribute('src')!, 'http://x').searchParams);

describe('FiveLooks', () => {
  it('draws the five looks in order on the theme it is given', () => {
    const { container } = render(<FiveLooks specimen="theme" theme="neutral" />);
    const params = srcs(container);
    expect(params.map((p) => p.get('look'))).toEqual(['today', 'dark', 'dark-photo', 'light', 'light-photo']);
    expect(params.every((p) => p.get('theme') === 'neutral' && p.get('specimen') === 'theme')).toBe(true);
  });

  it('draws Honcho Backstage\'s Today on honcho, with no todayTheme given (VI-829)', () => {
    const { container } = render(<FiveLooks specimen="button" theme="honcho-backstage" />);
    expect(srcs(container).map((p) => p.get('theme'))).toEqual([
      'honcho',
      'honcho-backstage',
      'honcho-backstage',
      'honcho-backstage',
      'honcho-backstage',
    ]);
  });

  it('draws Today on todayTheme when one is given', () => {
    const { container } = render(<FiveLooks specimen="theme" theme="neutral" todayTheme="space" />);
    expect(srcs(container).map((p) => p.get('theme'))).toEqual(['space', 'neutral', 'neutral', 'neutral', 'neutral']);
  });

  it('registers the theme specimen', () => {
    expect(LOOK_SPECIMENS.theme).toBeTypeOf('function');
  });
});
