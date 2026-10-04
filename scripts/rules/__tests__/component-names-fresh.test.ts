import { describe, it, expect } from 'vitest';
import {
  componentNamesFresh,
  diffNames,
  parseNames,
} from '../component-names-fresh.js';
import { renderOutput } from '../../generate-visor-component-names.js';

describe('component-names-fresh rule', () => {
  it('has correct metadata', () => {
    expect(componentNamesFresh.name).toBe('component-names-fresh');
    expect(componentNamesFresh.warnOnly).toBeFalsy();
  });

  describe('diffNames', () => {
    const rendered = new Set(['Button', 'TimePicker', 'Card']);

    it('reports TimePicker as missing when dropped from the committed set', () => {
      const committed = new Set(['Button', 'Card']);
      expect(diffNames(committed, rendered)).toEqual({
        missing: ['TimePicker'],
        extra: [],
      });
    });

    it('reports TimePicker as extra when added to the committed set', () => {
      const committed = new Set(['Button', 'Card']);
      const fresh = new Set(['Button', 'Card']);
      committed.add('TimePicker');
      expect(diffNames(committed, fresh)).toEqual({
        missing: [],
        extra: ['TimePicker'],
      });
    });

    it('reports nothing for identical sets', () => {
      expect(diffNames(rendered, new Set(rendered))).toEqual({
        missing: [],
        extra: [],
      });
    });
  });

  it('parseNames round-trips renderOutput', () => {
    const names = new Set(['Zed', 'Alpha', 'TimePicker']);
    expect(parseNames(renderOutput(names))).toEqual(names);
  });

  it('passes against the committed file', async () => {
    const results = await componentNamesFresh.run();
    expect(results).toHaveLength(1);
    expect(results[0]?.pass).toBe(true);
  });
});
