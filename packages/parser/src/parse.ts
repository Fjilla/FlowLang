import {
  Program,
  Statement,
  WhenStatement,
  IfStatement,
  ShowStatement,
  SetStatement,
  Expression,
  Identifier,
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  TimeLiteral,
  BinaryExpression,
  BinaryOp,
  ParseError,
  unquote,
  isQuotedString,
} from '@flowlang/core';
import { tokenizeLines, LineToken } from './tokenize.js';

type Cursor = { i: number };

const INDENT_STEP = 2; // v0.1: 2 spaces per indent level

export function parseFlow(input: string): Program {
  const lines = tokenizeLines(input);
  const cur: Cursor = { i: 0 };
  const body = parseBlock(lines, cur, 0);
  if (cur.i !== lines.length) {
    const t = lines[cur.i]!;
    throw new ParseError('Unexpected extra input', t.line);
  }
  return { type: 'Program', body };
}

function parseBlock(lines: LineToken[], cur: Cursor, baseIndent: number): Statement[] {
  const stmts: Statement[] = [];
  while (cur.i < lines.length) {
    const t = lines[cur.i]!;
    if (t.indent < baseIndent) break;
    if (t.indent > baseIndent) {
      throw new ParseError(
        `Unexpected indentation. Expected indent ${baseIndent} but got ${t.indent}.`,
        t.line,
      );
    }

    const stmt = parseStatement(lines, cur, baseIndent);
    stmts.push(stmt);
  }
  return stmts;
}

function parseStatement(lines: LineToken[], cur: Cursor, indent: number): Statement {
  const t = lines[cur.i]!;
  const text = t.text;

  if (text.toLowerCase().startsWith('when ')) {
    return parseWhen(lines, cur, indent);
  }
  if (text.toLowerCase().startsWith('if ')) {
    return parseIf(lines, cur, indent);
  }
  if (text.toLowerCase().startsWith('show ')) {
    return parseShow(lines, cur);
  }
  if (text.toLowerCase().startsWith('set ')) {
    return parseSet(lines, cur);
  }

  throw new ParseError(`Unknown statement: "${text}"`, t.line);
}

function parseWhen(lines: LineToken[], cur: Cursor, indent: number): WhenStatement {
  const t = lines[cur.i]!;
  const m = t.text.match(/^when\s+(.+)$/i);
  if (!m) throw new ParseError('Invalid when syntax', t.line);
  const eventName = m[1]!.trim();
  cur.i++;

  const next = lines[cur.i];
  if (!next || next.indent <= indent) {
    throw new ParseError('Expected an indented block after "when"', t.line);
  }
  if (next.indent !== indent + INDENT_STEP) {
    throw new ParseError(
      `Invalid indentation after "when". Expected ${indent + INDENT_STEP} spaces.`,
      next.line,
    );
  }
  const body = parseBlock(lines, cur, indent + INDENT_STEP);
  return { type: 'When', event: { type: 'Event', name: eventName }, body };
}

function parseIf(lines: LineToken[], cur: Cursor, indent: number): IfStatement {
  const t = lines[cur.i]!;
  const m = t.text.match(/^if\s+(.+)$/i);
  if (!m) throw new ParseError('Invalid if syntax', t.line);
  const testText = m[1]!.trim();
  cur.i++;

  const next = lines[cur.i];
  if (!next || next.indent <= indent) {
    throw new ParseError('Expected an indented block after "if"', t.line);
  }
  if (next.indent !== indent + INDENT_STEP) {
    throw new ParseError(
      `Invalid indentation after "if". Expected ${indent + INDENT_STEP} spaces.`,
      next.line,
    );
  }
  const thenBlock = parseBlock(lines, cur, indent + INDENT_STEP);

  // Optional else
  const maybeElse = lines[cur.i];
  if (maybeElse && maybeElse.indent === indent && /^else$/i.test(maybeElse.text)) {
    cur.i++;
    const afterElse = lines[cur.i];
    if (!afterElse || afterElse.indent <= indent) {
      throw new ParseError('Expected an indented block after "else"', maybeElse.line);
    }
    if (afterElse.indent !== indent + INDENT_STEP) {
      throw new ParseError(
        `Invalid indentation after "else". Expected ${indent + INDENT_STEP} spaces.`,
        afterElse.line,
      );
    }
    const elseBlock = parseBlock(lines, cur, indent + INDENT_STEP);
    return { type: 'If', test: parseExpression(testText, t.line), then: thenBlock, else: elseBlock };
  }

  return { type: 'If', test: parseExpression(testText, t.line), then: thenBlock };
}

function parseShow(lines: LineToken[], cur: Cursor): ShowStatement {
  const t = lines[cur.i]!;
  const m = t.text.match(/^show\s+(.+)$/i);
  if (!m) throw new ParseError('Invalid show syntax', t.line);
  const exprText = m[1]!.trim();
  cur.i++;
  return { type: 'Show', value: parseExpression(exprText, t.line) };
}

function parseSet(lines: LineToken[], cur: Cursor): SetStatement {
  const t = lines[cur.i]!;
  const m = t.text.match(/^set\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+to\s+(.+)$/i);
  if (!m) throw new ParseError('Invalid set syntax. Use: set <name> to <value>', t.line);
  const name = m[1]!;
  const exprText = m[2]!.trim();
  cur.i++;
  return { type: 'Set', name, value: parseExpression(exprText, t.line) };
}

// v0.1 expression parser:
// - string literal: "..." or '...'
// - boolean: true/false
// - number: 123 / 12.3
// - time: HH:MM
// - identifier: [a-zA-Z_][a-zA-Z0-9_]*
// - binary: <left> (is|is not|>|<|after|before) <right>
function parseExpression(text: string, line: number): Expression {
  const bin = splitBinary(text);
  if (bin) {
    const left = parseAtom(bin.left, line);
    const right = parseAtom(bin.right, line);
    return { type: 'Binary', op: bin.op, left, right } satisfies BinaryExpression;
  }
  return parseAtom(text, line);
}

function splitBinary(text: string): { left: string; op: BinaryOp; right: string } | null {
  // Order matters: "is not" before "is"
  const patterns: Array<[RegExp, BinaryOp]> = [
    [/^(.+?)\s+is\s+not\s+(.+)$/i, 'is_not'],
    [/^(.+?)\s+is\s+after\s+(.+)$/i, 'after'],
    [/^(.+?)\s+is\s+before\s+(.+)$/i, 'before'],
    [/^(.+?)\s+is\s+(.+)$/i, 'is'],
    [/^(.+?)\s*>\s*(.+)$/i, '>'],
    [/^(.+?)\s*<\s*(.+)$/i, '<'],
    [/^(.+?)\s+after\s+(.+)$/i, 'after'],
    [/^(.+?)\s+before\s+(.+)$/i, 'before'],
  ];

  for (const [re, op] of patterns) {
    const m = text.match(re);
    if (m) return { left: m[1]!.trim(), op, right: m[2]!.trim() };
  }
  return null;
}

function parseAtom(text: string, line: number): Expression {
  const t = text.trim();

  if (isQuotedString(t)) {
    return { type: 'StringLiteral', value: unquote(t) } satisfies StringLiteral;
  }

  if (/^(true|false)$/i.test(t)) {
    return { type: 'BooleanLiteral', value: t.toLowerCase() === 'true' } satisfies BooleanLiteral;
  }

  if (/^-?\d+(\.\d+)?$/.test(t)) {
    return { type: 'NumberLiteral', value: Number(t) } satisfies NumberLiteral;
  }

  if (/^(\d{2}):(\d{2})$/.test(t)) {
    return { type: 'TimeLiteral', value: t } satisfies TimeLiteral;
  }

  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(t)) {
    return { type: 'Identifier', name: t } satisfies Identifier;
  }

  throw new ParseError(`Invalid expression: "${text}"`, line);
}
