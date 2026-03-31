# Processr

A game-agnostic factory production planner. Build and visualize production graphs — place processr nodes, connect them, assign recipes, and plan your factory layout/ratios.

Client-side only. Your graph is saved in local storage.

## Stack
- **React 19** + **TypeScript** (strict, ES2023)
- **Vite 8** — dev server + bundler
- **@xyflow/react** (React Flow v12) — interactive node canvas
- **ESLint 9** — functional-style linting (no `let`, no classes, no loops)

## Getting started

```sh
npm install
npm run dev        # dev server with HMR at http://localhost:5173
npm run dev-host   # same, but exposed on the network (useful for LAN/mobile)
npm run build      # type-check + bundle
npm run preview    # preview production build locally
npm run lint       # ESLint check (add -- --fix to auto-fix)
```

No test framework is configured yet.

## How it works

**Sidebar** — lists all node templates and recipes from the active game pack. Click a template to add a node to the canvas.

**Canvas** — Uses React Flow canvas to render nodes and edges.

**Game packs** — A game pack is a JSON file that defines all available items, recipes, and processr nodes. 

**Persistence** — the graph auto-saves to `localStorage` on every change and reloads on page refresh.

## Project structure

```
src/
  components/
    App.tsx                    # Root layout (sidebar + canvas)
    Canvas.tsx                 # React Flow wrapper — drag, connect, select
    NodeTemplate.tsx           # Custom zyflow node template with neodrag contols
    ProcessrNodeComponent.tsx  # Custom React Flow node renderer
    Sidebar.tsx                # Template palette, recipe panel, pack import/export
  data/                        # Static data (demo game pack)
  models/                      # Pure type definitions — no runtime side effects
    ids.ts                     # Branded ID types (ItemId, RecipeId, …)
    items.ts                   # Item, Category, ItemForm
    recipes.ts                 # Recipe, RecipeItemStack
    nodes.ts                   # NodeTemplate, PortDefinition, NodeStats
    game-pack.ts               # GamePack (top-level container), GamePackIndex
    graph/
      processr-node.ts         # ProcessorNode — a placed instance of a NodeTemplate
      edge.ts                  # Edge — connection between two nodes
      graph.ts                 # Graph — top-level document (nodes, edges, viewport)
      graph-react-connector.ts  
    serialization/
      document.ts              # ProcessrDocument — JSON persistence format
      dsl.ts                   # DslDocument — conceptual text DSL (future)
    state/
      graph-state.ts           # Defines the graph-related slices of the zustand store
    index.ts                   # Barrel re-exports
  state/
    graph-actions-slice.ts     # Defines the function slice for the graph
    graph-slice.ts             # Defines the data slice for the graph
    store.ts                   # The zustand store is compiled from slices here
  utils/
    id.ts                      # Branded ID factory functions (wraps crypto.randomUUID)
    game-pack-index.ts         # Builds GamePackIndex lookup maps from a GamePack
    graph-factory.ts           # Creates Graph, ProcessorNode, Edge from templates
    graph-reducer.ts           # Controls modifications to the graph
    persistence.ts             # localStorage save/load of ProcessrDocument
    reactflow-bridge.ts        # Converts model types <-> React Flow types
    pack-io.ts                 # File-based game pack import/export (JSON)
    state-selectors.ts         # function to build the useProcessrStore.use attributes
  index.css                    # Global styles, CSS properties for light/dark theme
  main.tsx                     # Entry point
```

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
- Drag-from-sidebar to place nodes
- Undo/redo history
- DSL text editor (Mermaid-like)
- Multi-document support
- Community data packs for popular factory games
- Layout / blueprint designer