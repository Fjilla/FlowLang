export class FlowLangError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FlowLangError';
  }
}

export class ParseError extends FlowLangError {
  public readonly line: number;
  constructor(message: string, line: number) {
    super(`ParseError(line ${line}): ${message}`);
    this.name = 'ParseError';
    this.line = line;
  }
}
