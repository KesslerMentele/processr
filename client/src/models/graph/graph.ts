import type { GraphId, AtlasId, ProcessrNodeId, RecipeId, EdgeId, PortInstanceId } from "../ids.ts";
import type { Metadata, Position } from "../common.ts";
import type { PortInstance, ProcessrNode } from "./processr-node.ts";
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
  SetMultiNodeRecipes: "SET_MULTI_NODE_RECIPES",
  AddEdge: "ADD_EDGE",
  RemoveEdge: "REMOVE_EDGE",
  StackNodes: "STACK_NODES",
  UnstackNode: "UNSTACK_NODE",
  SetStackSize: "SET_STACK_SIZE"
} as const;

export const TransientAction = {
  Undo: "UNDO",
  Redo: "REDO",
  SetViewport: "SET_VIEWPORT",
} as const;

export type ReversibleAction = (typeof ReversibleAction)[keyof typeof ReversibleAction];

type TransientAction = (typeof TransientAction)[keyof typeof TransientAction];

export type ActionType = ReversibleAction | TransientAction;

export interface NodeRecipeUpdate {
  nodeId: ProcessrNodeId;
  recipeId: RecipeId | null;
  ports: readonly PortInstance[];
  invalidEdges: ReadonlyMap<EdgeId, Edge>
}

const EdgeInvalidationBehavior = {
  Delete: 'delete',
  Highlight: 'highlight'
} as const;

export type EdgeInvalidationBehavior = (typeof EdgeInvalidationBehavior)[keyof typeof EdgeInvalidationBehavior];

interface GraphActionPayloadMap {
  [ReversibleAction.AddNode]: { readonly node: ProcessrNode; readonly portInstances: ReadonlyMap<PortInstanceId, PortInstance> };
  [ReversibleAction.RemoveNode]: { readonly nodeId: ProcessrNodeId };
  [ReversibleAction.SetNodePositions]: { readonly positions: ReadonlyMap<ProcessrNodeId, Position> };
  [ReversibleAction.SetNodeRecipe]: { readonly update: NodeRecipeUpdate, readonly behavior: EdgeInvalidationBehavior };
  [ReversibleAction.SetMultiNodeRecipes]: { readonly updates: readonly NodeRecipeUpdate[]; readonly behavior:  EdgeInvalidationBehavior};
  [ReversibleAction.AddEdge]: { readonly edge: Edge };
  [ReversibleAction.RemoveEdge]: { readonly edgeId: EdgeId };
  [ReversibleAction.StackNodes]: { readonly survivorId: ProcessrNodeId; readonly removedIds: readonly ProcessrNodeId[]; readonly newCount: number };
  [ReversibleAction.UnstackNode]: { readonly nodeId: ProcessrNodeId; readonly newNodes: ReadonlyMap<ProcessrNodeId, ProcessrNode>; readonly newPortInstances: ReadonlyMap<PortInstanceId, PortInstance>; readonly newEdges: ReadonlyMap<EdgeId, Edge> };
  [ReversibleAction.SetStackSize]: {readonly nodeId: ProcessrNodeId, readonly newStackSize: number};
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
  [ReversibleAction.RemoveNode]: { readonly removedNode: ProcessrNode; readonly removedEdges: ReadonlyMap<EdgeId, Edge>; readonly removedPortInstances: ReadonlyMap<PortInstanceId, PortInstance> };
  [ReversibleAction.SetNodePositions]: { readonly previousPositions: ReadonlyMap<ProcessrNodeId, Position> };
  [ReversibleAction.SetNodeRecipe]: { readonly previousRecipeId: RecipeId | null; readonly previousPorts: readonly PortInstance[]; readonly changedEdges: ReadonlyMap<EdgeId, Edge> };
  [ReversibleAction.SetMultiNodeRecipes]: { readonly previousRecipes: ReadonlyMap<ProcessrNodeId, RecipeId | null>; readonly previousPorts: ReadonlyMap<ProcessrNodeId, readonly PortInstance[]>; readonly changedEdges: ReadonlyMap<EdgeId, Edge> };
  [ReversibleAction.AddEdge]: undefined;
  [ReversibleAction.RemoveEdge]: { readonly removedEdge: Edge };
  [ReversibleAction.StackNodes]: { readonly originalSurvivorCount: number; readonly removedNodes: ReadonlyMap<ProcessrNodeId, ProcessrNode>; readonly edgeSnapshot: ReadonlyMap<EdgeId, Edge>; readonly removedPortInstances: ReadonlyMap<PortInstanceId, PortInstance> };
  [ReversibleAction.UnstackNode]: { readonly newNodeIds: readonly ProcessrNodeId[]; readonly newEdgeIds: readonly EdgeId[]; readonly originalCount: number };
  [ReversibleAction.SetStackSize]: {readonly previousStackSize: number}
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
  readonly gamePackId: AtlasId;
  readonly nodes: ReadonlyMap<ProcessrNodeId, ProcessrNode>;
  readonly portInstances: ReadonlyMap<PortInstanceId, PortInstance>;
  readonly edges: ReadonlyMap<EdgeId, Edge>;
  readonly viewport: Viewport;
  readonly history: GraphHistory;
  /** ISO 8601 timestamps. */
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly metadata: Metadata;
}
