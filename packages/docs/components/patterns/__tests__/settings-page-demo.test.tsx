import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SettingsPageDemo } from '../settings-page-demo';

describe('SettingsPageDemo', () => {
  it('renders without throwing', () => {
    const { container } = render(<SettingsPageDemo />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders a settings section', () => {
    render(<SettingsPageDemo />);
    const matches = screen.getAllByText('General');
    expect(matches.length).toBeGreaterThan(0);
  });
});
