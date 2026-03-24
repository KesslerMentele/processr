# Processr

A game-agnostic production planner, calculator, and layout tool for factory games.

Processr helps players of games like Factorio, Satisfactory, Shapez, and others plan production chains, calculate ratios, and design factory layouts — all from the browser.

## Features (Planned)

- **Visual Production Planner** — Build and visualize production chains as node-based graphs. Connect inputs, outputs, and intermediates to map out your entire factory.
- **Ratio & Throughput Calculator** — Compute optimal machine counts, belt throughput, and resource requirements for any production target.
- **Layout Designer** — Design and arrange factory blueprints with a spatial editor.
- **Community Data Packs** — Import predefined recipe and item data for popular factory games. Community-maintained packs keep data up to date as games evolve.
- **Client-Side** — Everything runs locally in the browser. Your data stays on your machine.

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm

### Development

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
npm run preview   # preview the production build locally
```

### Lint

```bash
npm run lint
```

## Tech Stack

- React 19
- TypeScript
- Vite 8

## Roadmap

1. **Core data model** — Define the schema for items, recipes, machines, and production chains
2. **Visual production planner** — Node-based graph editor for building and connecting production chains
3. **Ratio calculator** — Compute optimal machine counts and throughput from a production graph
4. **Data pack system** — Import/export format for community-maintained game data packs
5. **Layout designer** — Spatial editor for arranging factory blueprints
6. **Community data packs** — Publish starter packs for popular factory games

## License

TBD