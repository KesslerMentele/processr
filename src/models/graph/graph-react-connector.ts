import type {ActionType, Graph, GraphAction} from "./graph.ts";
import type {GamePackIndex} from "../game-pack.ts";
import type {Dispatch} from "react";
import type {ProcessrNode} from "./processr-node.ts";


export interface GraphStateValue {
  readonly state: Graph;
  readonly packIndex: GamePackIndex;
}

export type GraphDispatchValue = Dispatch<GraphAction<ActionType>>;


export type ProcessrNodeData = ProcessrNode & Record<string, unknown>;