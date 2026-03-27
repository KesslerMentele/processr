import type {GraphId, GamePackId, ProcessrNodeId, RecipeId, EdgeId} from "../ids.ts";
import type {Metadata, Position} from "../common.ts";
import type { ProcessrNode } from "./processr-node.ts";
import type { Edge } from "./edge.ts";

/** Canvas viewport state (pan/zoom). */
export interface Viewport {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

type ReversibleAction =
  | "ADD_NODE"
  | "REMOVE_NODE"
  | "UPDATE_NODE_POSITION"
  | "SET_NODE_RECIPE"
  | "ADD_EDGE"
  | "REMOVE_EDGE"

type TransientAction =
  | "UNDO"
  | "REDO"
  | "SET_VIEWPORT"

export type ActionType = ReversibleAction | TransientAction;

export type GraphAction<T extends ActionType> =
  T extends "ADD_NODE" ? { readonly type: T;              readonly node: ProcessrNode } :
  T extends "REMOVE_NODE" ? { readonly type: T;           readonly nodeId: ProcessrNodeId } :
  T extends "UPDATE_NODE_POSITION" ? { readonly type: T;  readonly nodeId: ProcessrNodeId; readonly position: Position } :
  T extends "SET_NODE_RECIPE" ? { readonly type: T;       readonly nodeId: ProcessrNodeId; readonly recipeId: RecipeId | null } :
  T extends "ADD_EDGE" ? { readonly type: T;              readonly edge: Edge } :
  T extends "REMOVE_EDGE" ? { readonly type: T;           readonly edgeId: EdgeId } :
  T extends "SET_VIEWPORT" ? { readonly type: T;          readonly viewport: Viewport } :
  T extends "UNDO" ? { readonly type: T;} :
  T extends "REDO" ? { readonly type: T;} :
    never



type GraphChange<T extends ReversibleAction> =
  T extends "ADD_NODE" ? {action: GraphAction<T>} :
  T extends "REMOVE_NODE" ? {action: GraphAction<T>, removedNode: ProcessrNode} :
  T extends "UPDATE_NODE_POSITION" ? {action: GraphAction<T>, previousPosition: Position} :
  T extends "SET_NODE_RECIPE" ? {action: GraphAction<T>, previousRecipeId: RecipeId | null} :
  T extends "ADD_EDGE" ? {action: GraphAction<T>} :
  T extends "REMOVE_EDGE" ? {action: GraphAction<T>, removedEdge: Edge} :
    never

export interface GraphHistory {
  past: GraphChange<ReversibleAction>[];
  future: GraphChange<ReversibleAction>[]
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
  readonly nodes: readonly ProcessrNode[];
  readonly edges: readonly Edge[];
  readonly viewport: Viewport;
  readonly history: GraphHistory;
  /** ISO 8601 timestamps. */
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly metadata: Metadata;
}
