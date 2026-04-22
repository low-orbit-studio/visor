import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyStateDemo } from '../empty-state-demo';

describe('EmptyStateDemo', () => {
  it('renders the heading', () => {
    render(<EmptyStateDemo />);
    expect(screen.getByRole('heading', { name: /no results found/i })).toBeInTheDocument();
  });

  it('renders supporting text', () => {
    render(<EmptyStateDemo />);
    expect(
      screen.getByText(/try adjusting your search or filters/i)
    ).toBeInTheDocument();
  });

  it('renders Clear filters button', () => {
    render(<EmptyStateDemo />);
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });

  it('renders Create new button', () => {
    render(<EmptyStateDemo />);
    expect(screen.getByRole('button', { name: /create new/i })).toBeInTheDocument();
  });

  it('renders the magnifying glass icon wrapper', () => {
    const { container } = render(<EmptyStateDemo />);
    // The icon is wrapped in a div with opacity 0.5
    const iconWrapper = container.querySelector('div[style*="opacity: 0.5"]');
    expect(iconWrapper).toBeInTheDocument();
  });

  it('renders inside a card element', () => {
    const { container } = render(<EmptyStateDemo />);
    const card = container.querySelector('[data-slot="card"]');
    expect(card).toBeInTheDocument();
  });
});
