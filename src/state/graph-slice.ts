import { type StateCreator } from 'zustand';
import type { GraphSlice } from "../models";
import { loadProcessrGraph, loadGamePack } from "../utils/persistence.ts";
import { factorioPack } from "../assets/example-factorio-pack.ts";
import { createGraph } from "../utils/graph-factory.ts";
import { buildGamePackIndex } from "../utils/game-pack-index.ts";


const createGraphSlice: StateCreator<GraphSlice> = (): GraphSlice => {
  const pack = loadGamePack() ?? factorioPack;
  const graph = loadProcessrGraph() ?? createGraph(pack.id, "My Factory");
  return {
    graph,
    packIndex: buildGamePackIndex(pack),
    selectedNodeId: null
  };
};

export default createGraphSlice;