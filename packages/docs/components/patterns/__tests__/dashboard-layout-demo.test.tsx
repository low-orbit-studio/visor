import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DashboardLayoutDemo } from '../dashboard-layout-demo';

describe('DashboardLayoutDemo', () => {
  it('renders without throwing', () => {
    const { container } = render(<DashboardLayoutDemo />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders headings for stat cards', () => {
    render(<DashboardLayoutDemo />);
    expect(screen.getByText('Total revenue')).toBeInTheDocument();
    expect(screen.getByText('Active users')).toBeInTheDocument();
    expect(screen.getByText('Conversion rate')).toBeInTheDocument();
    expect(screen.getByText('Churn')).toBeInTheDocument();
  });
});
