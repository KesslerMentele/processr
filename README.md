# Processr

A game-agnostic factory production planner. Build and visualize production graphs — place processr nodes, connect them, assign recipes, and plan your factory layout/ratios.

## Stack
- **React 19** + **TypeScript** (strict, ES2023)
- **Vite 8** — dev server + bundler
- **@xyflow/react** (React Flow v12) — interactive node canvas
- **ESLint 9** — functional-style linting (no `let`, no classes, no loops)


## How it works

TBD

## Data model

Two layers separate static game definitions from mutable user state.

**Game Pack** — loaded once, immutable during a session. Defines all available items, recipes, and node types. Can be swapped at runtime via the import button.

**Graph** — the user's production plan. `ProcessorNode` instances reference a `NodeTemplate` by ID; `Edge` connects two nodes with optional port-level routing.

## Architecture pattern

**Functional Core, Imperative Shell**

- `src/models/` and `src/utils/` contain pure functions.
- Side effects exist only in components and hooks.

## Roadmap

- Ratio / throughput calculator
- DSL text editor (Mermaid-like)
- Multi-document support
- Community data packs for popular factory games
- Layout / blueprint designer
