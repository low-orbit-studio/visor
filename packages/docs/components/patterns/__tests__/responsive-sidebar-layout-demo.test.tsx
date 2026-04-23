import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ResponsiveSidebarLayoutDemo } from '../responsive-sidebar-layout-demo';

describe('ResponsiveSidebarLayoutDemo', () => {
  it('renders without throwing', () => {
    const { container } = render(<ResponsiveSidebarLayoutDemo />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders a nav element', () => {
    const { container } = render(<ResponsiveSidebarLayoutDemo />);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });
});
