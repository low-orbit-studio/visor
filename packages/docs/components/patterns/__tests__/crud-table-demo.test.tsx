import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CrudTableDemo } from '../crud-table-demo';

describe('CrudTableDemo', () => {
  it('renders without throwing', () => {
    expect(() => render(<CrudTableDemo />)).not.toThrow();
  });

  it('renders a table element', () => {
    const { container } = render(<CrudTableDemo />);
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
  });
});
