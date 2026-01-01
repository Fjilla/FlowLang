export type Program = {
  type: 'Program';
  body: Statement[];
};

export type Statement = WhenStatement | IfStatement | ShowStatement | SetStatement;

export type WhenStatement = {
  type: 'When';
  event: EventRef;
  body: Statement[];
};

export type EventRef = {
  type: 'Event';
  name: string; // free-form string, e.g. "user logs in"
};

export type IfStatement = {
  type: 'If';
  test: Expression;
  then: Statement[];
  else?: Statement[];
};

export type ShowStatement = {
  type: 'Show';
  value: Expression; // can be string literal or identifier
};

export type SetStatement = {
  type: 'Set';
  name: string;
  value: Expression;
};

export type Expression = StringLiteral | NumberLiteral | BooleanLiteral | TimeLiteral | Identifier | BinaryExpression;

export type StringLiteral = { type: 'StringLiteral'; value: string };
export type NumberLiteral = { type: 'NumberLiteral'; value: number };
export type BooleanLiteral = { type: 'BooleanLiteral'; value: boolean };
export type TimeLiteral = { type: 'TimeLiteral'; value: string }; // HH:MM
export type Identifier = { type: 'Identifier'; name: string };

export type BinaryOp = 'is' | 'is_not' | '>' | '<' | 'after' | 'before';

export type BinaryExpression = {
  type: 'Binary';
  op: BinaryOp;
  left: Expression;
  right: Expression;
};
