import { describe, it, expect } from 'vitest';
import { parseFlow } from '../src/parse.js';

describe('parseFlow', () => {
  it('parses a when/if/show program', () => {
    const program = parseFlow(`
when user logs in
  if time is after 22:00
    show "Good evening"
  else
    show "Hello"
`);
    expect(program.type).toBe('Program');
    expect(program.body[0]?.type).toBe('When');
  });

  it('parses set + show identifier', () => {
    const program = parseFlow(`
when app starts
  set greeting to "Hi"
  show greeting
`);
    const whenStmt: any = program.body[0];
    expect(whenStmt.body[0].type).toBe('Set');
    expect(whenStmt.body[1].type).toBe('Show');
  });
});
