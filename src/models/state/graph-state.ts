import type { ProcessrNode } from "../graph/processr-node.ts";
import type { EdgeId, ProcessrNodeId, RecipeId } from "../ids.ts";
import type { Position } from "../common.ts";
import type { Edge } from "../graph/edge.ts";
import type { Graph, Viewport } from "../graph/graph.ts";
import type { GamePackIndex } from "../game-pack.ts";

export interface GraphActionSlice {
  addNode: (node: ProcessrNode) => void;
  removeNode: (node: ProcessrNodeId) => void;
  updateNodePosition: (nodeId: ProcessrNodeId, position: Position) => void;
  setNodeRecipe: (nodeId: ProcessrNodeId, recipeId: RecipeId | null) => void;
  addEdge: (edge: Edge) => void;
  removeEdge: (edgeId: EdgeId) => void;
  setViewport: (viewport: Viewport) => void;
  loadGraph: (graph: Graph, packIndex:GamePackIndex) => void;
  screenToFlowPosition: (screenPos:Position) => Position;
  setSelectedNodeId: (id: ProcessrNodeId | null) => void;
  setScreenToFlowPosition: (fn: ((screenPos:Position) => Position)) => void;
  undo: () => void
  redo: () => void
}

export interface GraphSlice {
  graph: Graph;
  packIndex: GamePackIndex;
  selectedNodeId: ProcessrNodeId | null;
}
