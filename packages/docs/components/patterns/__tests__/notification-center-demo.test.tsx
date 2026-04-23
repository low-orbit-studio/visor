import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NotificationCenterDemo } from '../notification-center-demo';

describe('NotificationCenterDemo', () => {
  it('renders without throwing', () => {
    expect(() => render(<NotificationCenterDemo />)).not.toThrow();
  });

  it('renders a bell button', () => {
    render(<NotificationCenterDemo />);
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
  });

  it('renders notification tab content', () => {
    render(<NotificationCenterDemo />);
    expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /unread/i })).toBeInTheDocument();
  });
});
