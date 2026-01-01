#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { parseFlow } from '@flowlang/parser';
import { run } from '@flowlang/runtime';

function usage(): void {
  console.log(`FlowLang CLI

Usage:
  flow parse <file.flow>   Parse a .flow file and print the AST as JSON
  flow run <file.flow>     Run a .flow file (v0.1: runs all when blocks once)
  flow version             Print version
`);
}

function readFile(filePath: string): string {
  const abs = path.resolve(process.cwd(), filePath);
  return fs.readFileSync(abs, 'utf-8');
}

async function main(): Promise<void> {
  const [, , cmd, file] = process.argv;

  if (!cmd) {
    usage();
    process.exit(1);
  }

  if (cmd === 'version') {
    console.log('0.1.0');
    return;
  }

  if (cmd === 'parse') {
    if (!file) {
      console.error('Missing file path.');
      usage();
      process.exit(1);
    }
    const input = readFile(file);
    const program = parseFlow(input);
    console.log(JSON.stringify(program, null, 2));
    return;
  }

  if (cmd === 'run') {
    if (!file) {
      console.error('Missing file path.');
      usage();
      process.exit(1);
    }
    const input = readFile(file);
    const program = parseFlow(input);
    run(program, { vars: {}, onShow: (v) => console.log(String(v)) });
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  usage();
  process.exit(1);
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
