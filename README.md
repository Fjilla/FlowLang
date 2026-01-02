# FlowLang

A human-readable rule language designed for event-driven logic and automation.

> **Status:** Early prototype (v0.2). Syntax and APIs may change.

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


## Route DSL (v0.2)
FlowLang can describe routing intents in a simple, structured way.

```flow
route delivery
  from "Warehouse A"
  to "Customer B"
  prefer shortest_time
  avoid tolls
  max stops 6
```

Run:
```bash
npm run flow -- routes examples/route.flow
```

## Development
```bash
npm run dev
npm test
npm run lint
```

## Roadmap
- v0.1: parser + CLI + minimal runtime ✅
- v0.2: Route DSL and routes output ✅
- v0.3: richer expressions and plugin system

## License
MIT — see [LICENSE](LICENSE).
