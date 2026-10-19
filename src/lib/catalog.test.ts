import { describe, expect, it } from 'vitest';
import { parsePresets } from './catalog';

describe('quick-pick quantities', () => {
  it('reads "5, 10, 20" and similar input', () => {
    expect(parsePresets('5, 10, 20')).toEqual([5, 10, 20]);
    expect(parsePresets('20 st; 5 st, 10')).toEqual([5, 10, 20]);
    expect(parsePresets('')).toEqual([]);
    expect(parsePresets('0, 5, 5, 1000, 1, 2, 3, 4, 6, 7')).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
