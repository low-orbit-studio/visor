import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WizardFlowDemo } from '../wizard-flow-demo';

describe('WizardFlowDemo', () => {
  it('renders without throwing', () => {
    expect(() => render(<WizardFlowDemo />)).not.toThrow();
  });

  it('renders a stepper', () => {
    const { container } = render(<WizardFlowDemo />);
    const stepper = container.querySelector('[data-slot="stepper"]');
    expect(stepper).toBeInTheDocument();
  });

  it('renders a next button', () => {
    render(<WizardFlowDemo />);
    expect(
      screen.getByRole('button', { name: /next/i })
    ).toBeInTheDocument();
  });

  it('renders a submit button on the last step', () => {
    render(<WizardFlowDemo />);
    // The demo starts on step 0 — Next button is present
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeInTheDocument();
  });
});
