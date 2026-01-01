import { describe, it, expect } from 'vitest';
import { unquote } from '../src/utils.js';

describe('core utils', () => {
  it('unquote', () => {
    expect(unquote('"hi"')).toBe('hi');
  });
});
