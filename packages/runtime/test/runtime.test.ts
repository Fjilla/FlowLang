import { describe, it, expect } from 'vitest';
import { run } from '../src/index.js';
import type { Program } from '@flowlang/core';

describe('runtime', () => {
  it('prints show values via callback', () => {
    const program: Program = {
      type: 'Program',
      body: [
        {
          type: 'When',
          event: { type: 'Event', name: 'app starts' },
          body: [
            { type: 'Set', name: 'greeting', value: { type: 'StringLiteral', value: 'Hi' } },
            { type: 'Show', value: { type: 'Identifier', name: 'greeting' } },
          ],
        },
      ],
    };

    const out: unknown[] = [];
    const res = run(program, { vars: {}, onShow: (v) => out.push(v) });

    expect(out).toEqual(['Hi']);
    expect(res.vars.greeting).toBe('Hi');
    expect(res.routes).toEqual([]);
  });
});
