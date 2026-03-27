import type {Graph, Viewport} from "./graph.ts";
import type {GamePackIndex} from "../game-pack.ts";
import type {Dispatch} from "react";
import type {ProcessrNode} from "./processr-node.ts";
import type {EdgeId, ProcessrNodeId, RecipeId} from "../ids.ts";
import type {Edge} from "./edge.ts";
import type {Position} from "../common.ts";

export interface GraphStateValue {
  readonly state: Graph;
  readonly packIndex: GamePackIndex;
}

export type GraphDispatchValue = Dispatch<GraphAction>;

export type GraphAction =
  | { readonly type: "ADD_NODE";              readonly node: ProcessrNode }
  | { readonly type: "REMOVE_NODE";           readonly nodeId: ProcessrNodeId }
  | { readonly type: "UPDATE_NODE_POSITION";  readonly nodeId: ProcessrNodeId; readonly position: Position }
  | { readonly type: "SET_NODE_RECIPE";       readonly nodeId: ProcessrNodeId; readonly recipeId: RecipeId | null }
  | { readonly type: "ADD_EDGE";              readonly edge: Edge }
  | { readonly type: "REMOVE_EDGE";           readonly edgeId: EdgeId }
  | { readonly type: "SET_VIEWPORT";          readonly viewport: Viewport }

export type ProcessrNodeData = ProcessrNode & Record<string, unknown>;