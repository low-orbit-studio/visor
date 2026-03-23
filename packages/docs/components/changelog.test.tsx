import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import fs from 'fs';

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));

import { Changelog } from './changelog';

describe('Changelog', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders changelog content from file', () => {
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      '# @loworbitstudio/visor-core\n\n## 0.2.0\n\n### Minor Changes\n\n- Initial release'
    );

    render(<Changelog />);

    const markdown = screen.getByTestId('markdown');
    expect(markdown.textContent).toContain('Initial release');
    expect(markdown.textContent).toContain('0.2.0');
  });

  it('renders fallback when changelog file is missing', () => {
    vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });

    render(<Changelog />);

    const markdown = screen.getByTestId('markdown');
    expect(markdown.textContent).toContain('No changelog available yet');
  });
});
