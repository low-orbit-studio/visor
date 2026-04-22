import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AuthFlowDemo } from '../auth-flow-demo';

describe('AuthFlowDemo', () => {
  it('renders without throwing', () => {
    const { container } = render(<AuthFlowDemo />);
    expect(container).toBeTruthy();
  });

  it('contains a form element', () => {
    const { container } = render(<AuthFlowDemo />);
    expect(container.querySelector('form')).toBeTruthy();
  });
});
