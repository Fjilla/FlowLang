export function isQuotedString(s: string): boolean {
  return (s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"));
}

export function unquote(s: string): string {
  if (!isQuotedString(s)) return s;
  return s.slice(1, -1);
}
