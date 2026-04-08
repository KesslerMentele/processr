import type { ProcessrNode } from "../graph/processr-node.ts";
import type { EdgeId, NodeTemplateId, ProcessrNodeId, RecipeId } from "../ids.ts";
import type { Position } from "../common.ts";
import type { Edge } from "../graph/edge.ts";
import type { Graph, Viewport } from "../graph/graph.ts";
import type { Atlas, GamePackIndex } from "../atlas.ts";

export interface SetGraphData {
  readonly graph?: Graph;
  readonly packIndex: GamePackIndex;
}

export interface GraphActionSlice {
  addNode: (node: ProcessrNode) => void;
  removeNode: (node: ProcessrNodeId) => void;
  updateNodePositions: (positions: Readonly<Record<string, Position>>) => void;
  setNodeRecipe: (nodeId: ProcessrNodeId, recipeId: RecipeId | null) => void;
  addEdge: (edge: Edge) => void;
  removeEdge: (edgeId: EdgeId) => void;
  setViewport: (viewport: Viewport) => void;
  loadGraph: (options:SetGraphData) => void;
  loadGamePack: (pack: Atlas) => void;
  setSelectedNodeId: (id: ProcessrNodeId | null) => void;
  setDraggedTemplateId: (id: NodeTemplateId | null) => void;
  undo: () => void
  redo: () => void
}

export interface GraphSlice {
  graph: Graph;
  packIndex: GamePackIndex;
  selectedNodeId: ProcessrNodeId | null;
  draggedNodeTemplateId: NodeTemplateId | null;
}
