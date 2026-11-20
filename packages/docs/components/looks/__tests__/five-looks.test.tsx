import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { FiveLooks } from '../five-looks';
import { LOOK_SPECIMENS } from '../specimens';

const srcs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('iframe')).map((f) => new URL(f.getAttribute('src')!, 'http://x').searchParams);

describe('FiveLooks', () => {
  it('draws the five looks in order on the theme it is given', () => {
    const { container } = render(<FiveLooks specimen="theme" theme="honcho-backstage" />);
    const params = srcs(container);
    expect(params.map((p) => p.get('look'))).toEqual(['today', 'dark', 'dark-photo', 'light', 'light-photo']);
    expect(params.every((p) => p.get('theme') === 'honcho-backstage' && p.get('specimen') === 'theme')).toBe(true);
  });

  it('draws Today on todayTheme and every other look on theme', () => {
    const { container } = render(<FiveLooks specimen="theme" theme="honcho-backstage" todayTheme="honcho" />);
    expect(srcs(container).map((p) => p.get('theme'))).toEqual([
      'honcho',
      'honcho-backstage',
      'honcho-backstage',
      'honcho-backstage',
      'honcho-backstage',
    ]);
  });

  it('registers the theme specimen', () => {
    expect(LOOK_SPECIMENS.theme).toBeTypeOf('function');
  });
});
