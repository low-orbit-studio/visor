import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchResultsDemo } from '../search-results-demo';

describe('SearchResultsDemo', () => {
  it('renders without throwing', () => {
    expect(() => render(<SearchResultsDemo />)).not.toThrow();
  });

  it('renders a search input', () => {
    render(<SearchResultsDemo />);
    const input = screen.getByRole('textbox', { name: /search documentation/i });
    expect(input).toBeInTheDocument();
  });

  it('renders result cards when no filter is active', () => {
    const { container } = render(<SearchResultsDemo />);
    const cards = container.querySelectorAll('[data-slot="card"]');
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });
});
