import type { ProcessrNode } from "../graph/processr-node.ts";
import type { EdgeId, NodeTemplateId, ProcessrNodeId, RecipeId } from "../ids.ts";
import type { Position } from "../common.ts";
import type { Edge } from "../graph/edge.ts";
import type { Graph, Viewport } from "../graph/graph.ts";
import type { Atlas, AtlasIndex } from "../atlas.ts";

export interface SetGraphData {
  readonly graph?: Graph;
  readonly atlasIndex: AtlasIndex;
}

export interface GraphActionSlice {
  addNode: (node: ProcessrNode) => void;
  removeNode: (node: ProcessrNodeId) => void;
  updateNodePositions: (positions: Readonly<Record<string, Position>>) => void;
  setNodeRecipe: (nodeId: ProcessrNodeId, recipeId: RecipeId | null) => void;
  setNodeRecipes: (updates: { nodeId: ProcessrNodeId; recipeId: RecipeId | null }[]) => void;
  addEdge: (edge: Edge) => void;
  removeEdge: (edgeId: EdgeId) => void;
  loadGraph: (options:SetGraphData) => void;
  loadAtlas: (pack: Atlas) => void;
  setSelectedNodeIds: (ids: readonly ProcessrNodeId[]) => void;
  setDraggedTemplateId: (id: NodeTemplateId | null) => void;
  stackNodes: (selectedNodeIds: readonly ProcessrNodeId[]) => void;
  unstackNode: (nodeId: ProcessrNodeId) => void;
  setNodeStackSize: (nodeId: ProcessrNodeId, size: number) => void;
  setViewport: (viewport: Viewport) => void;
  undo: () => void
  redo: () => void
}

export interface GraphSlice {
  graph: Graph;
  atlasIndex: AtlasIndex;
  selectedNodeIds: readonly ProcessrNodeId[];
  draggedNodeTemplateId: NodeTemplateId | null;
}
