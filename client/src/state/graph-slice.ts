import { type StateCreator } from 'zustand';
import type { GraphSlice } from "../models";
import { loadProcessrGraph, loadAtlas } from "../utils/persistence.ts";
import { factorioPack } from "../data/example-factorio-pack.ts";
import { createGraph } from "../utils/graph-factory.ts";
import { buildGamePackIndex } from "../utils/game-pack-index.ts";


const createGraphSlice: StateCreator<GraphSlice> = (): GraphSlice => {
  const pack = loadAtlas() ?? factorioPack;
  const graph = loadProcessrGraph() ?? createGraph(pack.id, "My Factory");
  return {
    graph,
    packIndex: buildGamePackIndex(pack),
    selectedNodeId: null,
    draggedNodeTemplateId: null,
  };
};

export default createGraphSlice;