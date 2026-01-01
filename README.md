# FlowLang

A human-readable rule language designed for event-driven logic and automation.

> **Status:** Early prototype (v0.1). Syntax and APIs may change.

## What is FlowLang?
FlowLang is a small language with a focus on readability:
- Event blocks: `when ...`
- Branching: `if / else`
- Simple actions: `show`, `set`

### Example
```flow
when user logs in
  if time is after 22:00
    show "Good evening"
  else
    show "Hello"
```

## Repository layout
- `packages/core` — AST types and shared utilities
- `packages/parser` — tokenizer + parser (`.flow` → AST)
- `packages/runtime` — minimal interpreter (executes `show` and `set`)
- `packages/cli` — `flow` command

## Getting started
### Requirements
- Node.js 18+ (recommended)
- npm 9+

### Install
```bash
npm install
npm run build
```

### Try it
```bash
# Parse example to JSON AST
npm run flow -- parse examples/hello.flow

# Run example (prints show statements)
npm run flow -- run examples/hello.flow
```

## Development
```bash
npm run dev
npm test
npm run lint
```

## Roadmap
- v0.1: parser + CLI + minimal runtime ✅
- v0.2: route DSL + VS Code syntax highlighting
- v0.3: richer expressions and plugin system

## License
MIT — see [LICENSE](LICENSE).
