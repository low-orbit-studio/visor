import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModalFormDemo } from '../modal-form-demo';

describe('ModalFormDemo', () => {
  it('renders without throwing', () => {
    expect(() => render(<ModalFormDemo />)).not.toThrow();
  });

  it('renders a button', () => {
    render(<ModalFormDemo />);
    // The trigger button is aria-hidden when dialog is open; query with hidden:true
    const button = screen.getByRole('button', { name: /add member/i, hidden: true });
    expect(button).toBeInTheDocument();
  });

  it('dialog content includes a text input', () => {
    render(<ModalFormDemo />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });
});
