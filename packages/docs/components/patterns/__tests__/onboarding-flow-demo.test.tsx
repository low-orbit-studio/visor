import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OnboardingFlowDemo } from '../onboarding-flow-demo';

describe('OnboardingFlowDemo', () => {
  it('renders without throwing', () => {
    const { container } = render(<OnboardingFlowDemo />);
    expect(container.firstChild).not.toBeNull();
  });

  it('renders a stepper element', () => {
    const { container } = render(<OnboardingFlowDemo />);
    const stepper = container.querySelector('[data-slot="stepper"]');
    expect(stepper).toBeInTheDocument();
  });
});
