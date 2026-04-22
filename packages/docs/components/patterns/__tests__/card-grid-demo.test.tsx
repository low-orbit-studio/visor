import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CardGridDemo } from '../card-grid-demo';

describe('CardGridDemo', () => {
  it('renders without throwing', () => {
    const { container } = render(<CardGridDemo />);
    expect(container).toBeTruthy();
  });

  it('renders at least 3 card elements', () => {
    const { container } = render(<CardGridDemo />);
    const cards = container.querySelectorAll('[data-slot="card"]');
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });

  it('renders a CSS grid container', () => {
    const { container } = render(<CardGridDemo />);
    const grid = container.firstChild as HTMLElement;
    expect(grid.style.display).toBe('grid');
  });

  it('renders card titles', () => {
    render(<CardGridDemo />);
    expect(screen.getByText('Fast to Ship')).toBeInTheDocument();
    expect(screen.getByText('Themeable')).toBeInTheDocument();
    expect(screen.getByText('Accessible')).toBeInTheDocument();
  });
});
