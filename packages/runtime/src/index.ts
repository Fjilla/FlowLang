import type {
  Program,
  Statement,
  Expression,
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  TimeLiteral,
  Identifier,
  BinaryExpression,
} from '@flowlang/core';

export type RunResult = {
  shows: unknown[];
  vars: Record<string, unknown>;
  routes: unknown[];
};

export type RuntimeEnv = {
  vars: Record<string, unknown>;
  now?: Date;
  onShow?: (value: unknown) => void;
};

export function run(program: Program, env: RuntimeEnv = { vars: {} }): RunResult {
  const result: RunResult = {
    shows: [],
    vars: env.vars ?? {},
    routes: [],
  };
  env.vars = result.vars;

  // v0.1: run all top-level "when" bodies once (no event system yet).
  for (const stmt of program.body) {
    execStatement(stmt, env, result);
  }
  return result;
}

function execStatement(stmt: Statement, env: RuntimeEnv, result: RunResult): void {
  switch (stmt.type) {
    case 'When':
      for (const s of stmt.body) execStatement(s, env, result);
      return;

    case 'If': {
      const ok = truthy(evalExpression(stmt.test, env));
      if (ok) {
        for (const s of stmt.then) execStatement(s, env, result);
      } else if (stmt.else) {
        for (const s of stmt.else) execStatement(s, env, result);
      }
      return;
    }

    case 'Set': {
      env.vars[stmt.name] = evalExpression(stmt.value, env);
      return;
    }

    case 'Route': {
      // v0.2: collect route plans (no optimization engine yet)
      result.routes.push(stmt);
      return;
    }

    case 'Show': {
      const value = evalExpression(stmt.value, env);
      result.shows.push(value);
      if (env.onShow) env.onShow(value);
      else console.log(String(value));
      return;
    }

    default:
      // Exhaustive check
      // @ts-expect-error
      throw new Error(`Unknown statement type: ${stmt.type}`);
  }
}

function evalExpression(expr: Expression, env: RuntimeEnv): unknown {
  switch (expr.type) {
    case 'StringLiteral':
      return (expr as StringLiteral).value;
    case 'NumberLiteral':
      return (expr as NumberLiteral).value;
    case 'BooleanLiteral':
      return (expr as BooleanLiteral).value;
    case 'TimeLiteral':
      return (expr as TimeLiteral).value;
    case 'Identifier':
      return env.vars[(expr as Identifier).name] ?? (expr as Identifier).name;

    case 'Binary':
      return evalBinary(expr as BinaryExpression, env);

    default:
      // @ts-expect-error
      throw new Error(`Unknown expression type: ${expr.type}`);
  }
}

function evalBinary(expr: BinaryExpression, env: RuntimeEnv): boolean {
  const left = evalExpression(expr.left, env);
  const right = evalExpression(expr.right, env);

  switch (expr.op) {
    case 'is':
      return String(left) === String(right);
    case 'is_not':
      return String(left) !== String(right);
    case '>':
      return Number(left) > Number(right);
    case '<':
      return Number(left) < Number(right);
    case 'after':
      return timeToMinutes(String(left), env) > timeToMinutes(String(right), env);
    case 'before':
      return timeToMinutes(String(left), env) < timeToMinutes(String(right), env);
    default:
      // @ts-expect-error
      throw new Error(`Unknown binary operator: ${expr.op}`);
  }
}

function truthy(v: unknown): boolean {
  return !!v;
}

function timeToMinutes(value: string, env: RuntimeEnv): number {
  if (value === 'time') {
    const d = env.now ?? new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
  const m = value.match(/^(\d{2}):(\d{2})$/);
  if (!m) return NaN;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  return hh * 60 + mm;
}
