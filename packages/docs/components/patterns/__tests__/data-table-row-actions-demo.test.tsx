import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DataTableRowActionsDemo } from '../data-table-row-actions-demo';

describe('DataTableRowActionsDemo', () => {
  it('renders without throwing', () => {
    expect(() => render(<DataTableRowActionsDemo />)).not.toThrow();
  });

  it('renders a table element', () => {
    render(<DataTableRowActionsDemo />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders at least one dropdown trigger button', () => {
    render(<DataTableRowActionsDemo />);
    const triggers = screen.getAllByRole('button', { name: /row actions/i });
    expect(triggers.length).toBeGreaterThanOrEqual(1);
  });
});
