import type { GraphId, GamePackId, ProcessrNodeId, RecipeId, EdgeId } from "../ids.ts";
import type { Metadata, Position } from "../common.ts";
import type { ProcessrNode } from "./processr-node.ts";
import type { Edge } from "./edge.ts";

/** Canvas viewport state (pan/zoom). */
export interface Viewport {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

export const ReversibleAction = {
  AddNode: "ADD_NODE",
  RemoveNode: "REMOVE_NODE",
  SetNodePositions: "SET_NODE_POSITIONS",
  SetNodeRecipe: "SET_NODE_RECIPE",
  AddEdge: "ADD_EDGE",
  RemoveEdge: "REMOVE_EDGE",
} as const;

export const TransientAction = {
  Undo: "UNDO",
  Redo: "REDO",
  SetViewport: "SET_VIEWPORT",
} as const;

export type ReversibleAction = (typeof ReversibleAction)[keyof typeof ReversibleAction];

type TransientAction = (typeof TransientAction)[keyof typeof TransientAction];

export type ActionType = ReversibleAction | TransientAction;

interface GraphActionPayloadMap {
  [ReversibleAction.AddNode]: { readonly node: ProcessrNode };
  [ReversibleAction.RemoveNode]: { readonly nodeId: ProcessrNodeId };
  [ReversibleAction.SetNodePositions]: { readonly positions: Readonly<Record<string, Position>> };
  [ReversibleAction.SetNodeRecipe]: { readonly nodeId: ProcessrNodeId; readonly recipeId: RecipeId | null; readonly invalidEdges: Readonly<Record<string, Edge>>; readonly behavior: 'delete' | 'highlight' };
  [ReversibleAction.AddEdge]: { readonly edge: Edge };
  [ReversibleAction.RemoveEdge]: { readonly edgeId: EdgeId };
  [TransientAction.SetViewport]: { readonly viewport: Viewport };
  [TransientAction.Undo]: undefined;
  [TransientAction.Redo]: undefined;
}

export type GraphAction<T extends ActionType = ActionType> = {
  [K in T]: GraphActionPayloadMap[K] extends undefined
    ? { readonly type: K; }
    : { readonly type: K; payload: GraphActionPayloadMap[K] }
}[T];

interface GraphChangePayloadMap {
  [ReversibleAction.AddNode]: undefined;
  [ReversibleAction.RemoveNode]: { readonly removedNode: ProcessrNode; readonly removedEdges: Readonly<Record<string, Edge>> };
  [ReversibleAction.SetNodePositions]: { readonly previousPositions: Readonly<Record<string, Position>> };
  [ReversibleAction.SetNodeRecipe]: { readonly previousRecipeId: RecipeId | null; readonly changedEdges: Readonly<Record<string, Edge>>;};
  [ReversibleAction.AddEdge]: undefined;
  [ReversibleAction.RemoveEdge]: { readonly removedEdge: Edge };
}

export type GraphChange<T extends ReversibleAction = ReversibleAction> = {
  [K in T]: GraphChangePayloadMap[K] extends undefined
    ? { readonly type: K; readonly action: GraphAction<K>; }
    : { readonly type: K; readonly action: GraphAction<K>; payload: GraphChangePayloadMap[K] }
}[T];

export interface GraphHistory {
  past: GraphChange[];
  future: GraphChange[];
}

/**
 * A Graph is the top-level container for a user's production plan.
 * It holds all placed nodes and edges, and references the game pack
 * that provides static definitions.
 *
 * The graph does NOT embed the game pack data. It references the pack
 * by ID. When loading, the application resolves the pack ID to the
 * actual GamePack data.
 */
export interface Graph {
  readonly id: GraphId;
  readonly name: string;
  readonly description?: string;
  readonly gamePackId: GamePackId;
  readonly nodes: Readonly<Record<string, ProcessrNode>>;
  readonly edges: Readonly<Record<string, Edge>>;
  readonly viewport: Viewport;
  readonly history: GraphHistory;
  /** ISO 8601 timestamps. */
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly metadata: Metadata;
}
