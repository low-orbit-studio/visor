import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DataTableWithFiltersDemo } from '../data-table-with-filters-demo';

describe('DataTableWithFiltersDemo', () => {
  it('renders without throwing', () => {
    expect(() => render(<DataTableWithFiltersDemo />)).not.toThrow();
  });

  it('renders a search input', () => {
    render(<DataTableWithFiltersDemo />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });
});
