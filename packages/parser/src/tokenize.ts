import { ParseError } from '@flowlang/core';

export type LineToken = {
  line: number;
  indent: number; // number of spaces
  text: string;   // trimmed
  raw: string;    // original line
};

export function tokenizeLines(input: string): LineToken[] {
  const lines = input.replace(/\r\n/g, '\n').split('\n');
  const tokens: LineToken[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? '';
    if (raw.trim() === '' || raw.trim().startsWith('#')) continue;

    const match = raw.match(/^(\s*)(.*)$/);
    const indentStr = match?.[1] ?? '';
    const text = (match?.[2] ?? '').trimEnd();

    if (/\t/.test(indentStr)) {
      throw new ParseError('Tabs are not allowed. Use spaces for indentation.', i + 1);
    }
    const indent = indentStr.length;

    tokens.push({ line: i + 1, indent, text: text.trim(), raw });
  }
  return tokens;
}
