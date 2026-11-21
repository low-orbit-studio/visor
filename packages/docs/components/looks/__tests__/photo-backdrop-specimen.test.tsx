import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { LOOKS } from '../looks';
import { PhotoBackdropSpecimen } from '../photo-backdrop-specimen';

const PHOTOS = ['/day.webp', '/night.webp'];
const layers = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('[data-slot="photo-backdrop-layer"]')];
const srcOf = (layer: HTMLElement) => layer.querySelector('img')!.getAttribute('src');
// jsdom has no AnimationEvent, so React listens for the webkit name there; send both.
const animationEnd = (el: Element) =>
  act(() => {
    el.dispatchEvent(new Event('animationend', { bubbles: true }));
    el.dispatchEvent(new Event('webkitAnimationEnd', { bubbles: true }));
  });

// jsdom has no decode(); the backdrop's preload queue awaits it.
beforeEach(() => {
  HTMLImageElement.prototype.decode = () => Promise.resolve();
});
afterEach(() => {
  delete (HTMLImageElement.prototype as { decode?: unknown }).decode;
  vi.restoreAllMocks();
});

describe('PhotoBackdropSpecimen', () => {
  it('Next Photo puts the other photo on top, fades it in, then drops the old one', () => {
    const look = LOOKS.find((l) => l.id === 'dark-photo')!;
    // StrictMode, as the docs app runs it.
    const { container } = render(
      <StrictMode>
        <PhotoBackdropSpecimen look={look} mode="dark" photos={PHOTOS} />
      </StrictMode>,
    );
    fireEvent.load(container.querySelector('img')!);
    expect(layers(container).map(srcOf)).toEqual(['/day.webp']);

    fireEvent.click(screen.getByRole('button', { name: 'Next Photo' }));
    const [under, top] = layers(container);
    expect([under, top].map((l) => srcOf(l!))).toEqual(['/day.webp', '/night.webp']);
    expect(top).not.toHaveAttribute('data-ready');

    fireEvent.load(top!.querySelector('img')!);
    expect(top).toHaveAttribute('data-ready');
    animationEnd(top!);
    expect(layers(container).map(srcOf)).toEqual(['/night.webp']);

    fireEvent.click(screen.getByRole('button', { name: 'Next Photo' }));
    expect(layers(container).map(srcOf)).toEqual(['/night.webp', '/day.webp']);
  });

  it('Next Photo swaps when the other photo is already cached', () => {
    // A preloaded photo is complete the moment its <img> mounts, so it fires no load event.
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(1280);
    const look = LOOKS.find((l) => l.id === 'dark-photo')!;
    const { container } = render(
      <StrictMode>
        <PhotoBackdropSpecimen look={look} mode="dark" photos={PHOTOS} />
      </StrictMode>,
    );
    expect(layers(container).map(srcOf)).toEqual(['/day.webp']);
    fireEvent.click(screen.getByRole('button', { name: 'Next Photo' }));
    const [, top] = layers(container);
    expect(layers(container).map(srcOf)).toEqual(['/day.webp', '/night.webp']);
    expect(top).toHaveAttribute('data-ready');
  });

  it('draws nothing and offers no Next Photo in a look without a photo', () => {
    const look = LOOKS.find((l) => l.id === 'dark')!;
    const { container } = render(<PhotoBackdropSpecimen look={look} mode="dark" photos={PHOTOS} />);
    expect(container.querySelector('[data-slot="photo-backdrop"]')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Next Photo' })).toBeNull();
  });
});
