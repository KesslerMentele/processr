import {type GraphState} from "./graph-store.ts";
import type {Edge, EdgeId, Graph, Position, ProcessrNode, ProcessrNodeId, RecipeId, Viewport} from "../models";
import type {StoreApi} from "zustand";
import {graphReducer} from "./graph-reducer.ts";

type SetGraph = StoreApi<GraphState>['setState']

export const createGraphActions = (set: SetGraph) => ({
  addNode: (node: ProcessrNode) => {
    set((state) => (
      {...state, graph: graphReducer(state.graph, {type: "ADD_NODE", node})}
    ))
  },
  removeNode: (nodeId: ProcessrNodeId) => {
    set((state) => (
      {...state, graph: graphReducer(state.graph, {type: "REMOVE_NODE", nodeId})}
    ))
  },
  updateNodePosition: (nodeId: ProcessrNodeId, position: Position) => {
    set((state) => (
      {...state, graph: graphReducer(state.graph, {type: "UPDATE_NODE_POSITION", nodeId, position})}
    ))
  },
  setNodeRecipe: (nodeId: ProcessrNodeId, recipeId: RecipeId | null) => {
    set((state) => (
      {...state, graph: graphReducer(state.graph, {type: "SET_NODE_RECIPE", nodeId, recipeId})}
    ))
  },
  addEdge: (edge: Edge) => {
    set((state) => (
      {...state, graph: graphReducer(state.graph, {type: "ADD_EDGE", edge})}
    ))
  },
  removeEdge: (edgeId: EdgeId) => {
    set((state) => (
      {...state, graph: graphReducer(state.graph, {type: "REMOVE_EDGE", edgeId})}
    ))
  },
  setViewport: (viewport: Viewport) => {
    set((state) => (
      {...state, graph: graphReducer(state.graph, {type: "SET_VIEWPORT", viewport})}
    ))
  },
  loadGraph: (graph: Graph) => {
    set((state) => (
      {...state, graph}
    ))
  }
})