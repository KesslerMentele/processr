import type {Graph, Viewport} from "./graph.ts";
import type {GamePackIndex} from "../game-pack.ts";
import type {Dispatch} from "react";
import type {ProcessorNode} from "./processor-node.ts";
import type {EdgeId, ProcessorNodeId, RecipeId} from "../ids.ts";
import type {Edge} from "./edge.ts";
import type {Position} from "../common.ts";

export interface GraphStateValue {
  readonly state: Graph;
  readonly packIndex: GamePackIndex;
}

export type GraphDispatchValue = Dispatch<GraphAction>;

export type GraphAction =
  | { readonly type: "ADD_NODE";              readonly node: ProcessorNode }
  | { readonly type: "REMOVE_NODE";           readonly nodeId: ProcessorNodeId }
  | { readonly type: "UPDATE_NODE_POSITION";  readonly nodeId: ProcessorNodeId; readonly position: Position }
  | { readonly type: "SET_NODE_RECIPE";       readonly nodeId: ProcessorNodeId; readonly recipeId: RecipeId | null }
  | { readonly type: "ADD_EDGE";              readonly edge: Edge }
  | { readonly type: "REMOVE_EDGE";           readonly edgeId: EdgeId }
  | { readonly type: "SET_VIEWPORT";          readonly viewport: Viewport }
  | { readonly type: "LOAD_GRAPH";            readonly graph: Graph }

export type ProcessorNodeData = ProcessorNode & Record<string, unknown>;